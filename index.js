const express = require('express')
const app = express()
const bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html')
})

app.get('/messages', function (req, res) {
  res.send('Get Messages from DB')
})

app.get('/bookstatus', function (req, res) {
  res.send('Get Book Status from DB')
})

app.post('/message', function (req, res) {
  console.log(req.body);
})

app.post('/upvote', function (req, res) {
  console.log(req.body);
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
