const express = require('express')
const app = express()

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html')
})

app.post('/message', function (req, res) {
  console.log(req);
  res.send('Got a POST request ' + req.toString())
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
