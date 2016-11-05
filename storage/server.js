// require the dependencies we installed
const express = require('express');
const app = express();
const responseTime = require('response-time');
const redis = require('redis');
const fs = require('fs');

// create a new redis client and connect to our local redis instance
var client = redis.createClient();

// Set key value pair: [photoid, [offset, size, type]]
// client.set('1', ['0', '1024', 'jpg'])

// set the server listening port
app.set('port', (process.env.PORT || 8080));

// set up the response-time middleware
app.use(responseTime());

app.get('/', function (req, res) {
  res.send('Hello World');
});

// READ request
app.get('/:lvid/:photoid', function(req, res) {
  var lvid = req.params.lvid
  var photoid = req.params.photoid;

  console.log('Received READ request:');
  console.log('logical volumn id: '+lvid);
  console.log('photo id: '+photoid);

  // client.get(photoid, function(err, reply) {
  //   console.log(reply);
  // })

  res.send('OK')
});

// WRITE request
// TODO

// DELETE request
// TODO

app.listen(app.get('port'), function() {
  console.log('Server listening on port: ', app.get('port'));
});
