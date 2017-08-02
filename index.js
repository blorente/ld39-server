const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:dbpass@localhost:5433/ld';
const book = require('./book.js');
const dbpass = process.env.DBDROP_PASS;
const canDrop = process.env.DBDROP_PASS !== undefined;

app.set('port', (process.env.PORT || 3000));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html')
})

app.get('/messages', function (req, res) {
  const results = [];
  // Get a Postgres client from the connection pool
  const data = {
    startid: parseInt(req.query.startid),
    amount: parseInt(req.query.msgamount)
  };

  let querystring = ''
  if (!req.query.startid) {
    querystring = 'SELECT * FROM messages ORDER BY upvotes DESC;'
  } else if (!data.amount) {
    if (data.startid != 0) {
      querystring = 'SELECT * FROM messages ORDER BY upvotes DESC OFFSET ' + data.startid + ' ;'
    } else {
      querystring = 'SELECT * FROM messages ORDER BY upvotes DESC;'
    }
  } else {
    if (data.startid != 0) {
      querystring = 'SELECT * FROM messages ORDER BY upvotes DESC OFFSET ' + data.startid + ' fetch first ' + data.amount + " rows only;"
    } else {
      querystring = 'SELECT * FROM messages ORDER BY upvotes DESC fetch first ' + data.amount + " rows only;"
    }
  }
  console.log(querystring);
  pg.connect(connectionString, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query(querystring);
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
})

app.get('/bookstatus', function (req, res) {
  book.getBookStatus((status) => {
    res.send(status);
  })
})

app.post('/message', function (req, res) {
  console.log(req.body);
  const results = [];
  // Grab data from http request
  const data = {msg: req.body.message, upvotes: 0};
  // Get a Postgres client from the connection pool
  pg.connect(connectionString, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Insert Data
    client.query('INSERT INTO messages(content, upvotes) values($1, $2)',
    [data.msg, data.upvotes]);
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM messages ORDER BY id ASC');
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
})

app.post('/upvote', function (req, res) {
  const results = [];
  // Grab data from the URL parameters
  let id = -1;
  if (req.body.mid !== undefined) {
    id = parseInt(req.body.mid);
    console.log('Upvoting msg ' + id);
    pg.connect(connectionString, (err, client, done) => {
      if(err) {
        done();
        console.log(err);
        return res.status(500).json({success: false, data: err});
      }
      // SQL Query > Update Data
      client.query('UPDATE messages SET content=content, upvotes=upvotes + 1 WHERE id=($1)',
      [id]);
      // SQL Query > Select Data
      const query = client.query("SELECT * FROM messages ORDER BY id ASC");
      // Stream results back one row at a time
      query.on('row', (row) => {
        results.push(row);
      });
      // After all data is returned, close connection and return results
      book.updateBookStatus(1);
      query.on('end', function() {
        done();
        return res.json(results);
      });
    });
    return;
  }
  console.log("Not the necessary info in the request body: " + req.body);
  res.json(500);
})

app.delete('/all/:dbpass', (req, res, next) => {
  const results = [];
  if (!canDrop) {
    console.log("Cannot delete messages: No pass provided");
    res.json(500);
  } else {
    if (dbpass === req.params.dbpass) {
      // Get a Postgres client from the connection pool
      pg.connect(connectionString, (err, client, done) => {
        // Handle connection errors
        if(err) {
          done();
          console.log(err);
          return res.status(500).json({success: false, data: err});
        }
        // SQL Query > Delete Data
        client.query('TRUNCATE TABLE messages RESTART IDENTITY;');
        createTable();
        // SQL Query > Select Data
        var query = client.query('SELECT * FROM messages ORDER BY id ASC');
        // Stream results back one row at a time
        query.on('row', (row) => {
          results.push(row);
        });
        // After all data is returned, close connection and return results
        query.on('end', () => {
          done();
          return res.json(results);
        });
      });
    } else {
      console.log("Cannot delete message: Wrong password ("+req.params.dbpass+") expected "+dbpass);
      res.json(500);
    }
  }
});

app.delete('/message/:id/:dbpass', (req, res, next) => {
  const results = [];
  const id = req.params.id;
  if (!canDrop) {
    console.log("Cannot delete messages: No pass provided");
    res.json(500);
  } else {
    if (dbpass === req.params.dbpass) {
      // Get a Postgres client from the connection pool
      pg.connect(connectionString, (err, client, done) => {
        // Handle connection errors
        if(err) {
          done();
          console.log(err);
          return res.status(500).json({success: false, data: err});
        }
        client.query('DELETE FROM messages WHERE id=($1)', [id]);
        var query = client.query('SELECT * FROM messages ORDER BY id ASC');
        query.on('row', (row) => {
          results.push(row);
        });
        query.on('end', () => {
          done();
          return res.json(results);
        });
      });
    } else {
      console.log("Cannot delete message: Wrong password ("+req.params.dbpass+") expected "+dbpass);
      res.json(500);
    }
  }
});

app.listen(app.get('port'), function () {
  console.log('Example app listening on port ' + app.get('port'))
})

function createTable() {
  const client = new pg.Client(connectionString);
  client.connect();
  const query = client.query(
    'CREATE TABLE IF NOT EXISTS messages(id SERIAL PRIMARY KEY, content TEXT not null, upvotes INT)');
  query.on('end', () => { client.end(); });
}
