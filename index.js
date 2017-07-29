const express = require('express')
const app = express()

app.post('/message', function (req, res) {
  console.log(req);
  res.send('Got a POST request ' + req.toString())
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})