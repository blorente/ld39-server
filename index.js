const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:dbpass@localhost:5433/ld';

app.set('port', (process.env.PORT || 3000));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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
  if (!data.startid) {
    querystring = 'SELECT * FROM messages ORDER BY id ASC;'
  } else if (!data.amount) {
    querystring = 'SELECT * FROM messages WHERE id >= ' + data.startid + 'ORDER BY id ASC;'
  } else {
    querystring = 'SELECT * FROM messages WHERE id >= ' + data.startid + 'AND id < ' + (data.startid + data.amount) + ' ORDER BY id ASC;'
  }
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
  res.send('Get Book Status from DB')
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

app.listen(app.get('port'), function () {
  console.log('Example app listening on port ' + app.get('port'))
  const client = new pg.Client(connectionString);
  client.connect();
  const query = client.query(
    'CREATE TABLE IF NOT EXISTS messages(id SERIAL PRIMARY KEY, content TEXT not null, upvotes INT)');
  query.on('end', () => { client.end(); });
})
