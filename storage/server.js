// require the dependencies we installed
const express = require('express');
const app = express();
const responseTime = require('response-time');
const redis = require('redis');
const fs = require('fs');
const filePointer = require("filepointer");

// create a new redis client and connect to our local redis instance
var client = redis.createClient();

// Set key value pair: [photoid, [offset, size, type]]
client.rpush(['1', '0', '82931', 'gif'])

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

  client.lrange(photoid, 0, -1, function(err, reply) {
    if (err){
      // TODO: handle error
      console.log('error');
      res.send('something is wrong')
    } else {
      console.log(reply);
      var offset = parseInt(reply[0]);
      var size = parseInt(reply[1]);
      var type = reply[2];

      var logicalVolume = fs.readFileSync("/root/data/"+lvid)
      
      var fp = new filePointer(logicalVolume);
      var buffer = fp.copy_abs(offset, offset+size);

      res.setHeader('Content-Type', 'image/'+type);
      res.end(new Buffer(buffer, 'base64'));  
    }
  });
});

// WRITE request
// TODO

// DELETE request
// TODO

app.listen(app.get('port'), function() {
  console.log('Server listening on port: ', app.get('port'));
});
