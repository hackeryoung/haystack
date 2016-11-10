// require the dependencies we installed
const express = require('express');
const app = express();
const responseTime = require('response-time');
const redis = require('redis');
const fs = require('fs');
Stream = require('stream').Transform;


// create a new redis client and connect to our local redis instance
var client = redis.createClient();

// Create http object to communicate with Haystack Store
var http = require('http');


// if an error occurs, print it to the console
client.on('error', function(err) {
  console.log("Error " + err);
});

// set the server listening port
app.set('port', (process.env.PORT || 8080));

// set up the response-time middleware
app.use(responseTime());

// set up static images directory
// app.use(express.static('imgs'));

// serve images in /photos/
app.get('/:mid/:lvid/:pid', function(req, res) {
  var pid = req.params.pid;
  var mid = req.params.mid;
  var lvid = req.params.lvid;
  // res.sendFile(__dirname + '/imgs/phd_' + photoid + '.gif');

  console.log((new Date()).toTimeString(), {'action':'read', 'pid':pid, 'mid':mid, 'lvid':lvid});

  // check redis cache first; if no hit, read from disk and cache it in readis
  client.get(pid, function(error, result) {
    if (result) {
      // Found in Redis, just construct the response.
      res.setHeader('Content-Type', 'image/gif');
      res.end(new Buffer(result, 'base64'));
      console.log((new Date()).toTimeString(), {
        'source': 'redis'
      });
    } else {
      // Decode the IP of the machine
      const ip = new Buffer(mid, 'base64').toString('ascii');
      console.log("store ip: " + ip);
      var params = {
        host: ip,
        path: '/'+[lvid, pid].join('/'),
        port: 8080
      };

      http.request(params, function(response) {
        var data = new Stream();

        response.on('data', function(chunk) {
          data.push(chunk);
        });

        response.on('end', function() {
          var dataBuffer = data.read();
          res.setHeader('Content-Type', 'image/gif');
          res.end(new Buffer(dataBuffer, 'base64'));
          console.log((new Date()).toTimeString(), {
            'source': 'Haystack Store'
          });

          // Cache the image in the Redis.
          client.setex(pid, 120, new Buffer(dataBuffer).toString('base64'));
        });
      }).end();
    }
  });
});

// // Update image.
// app.post('/upload', function(req, res) {
//   var pid = req.body.pid;
//   var mid = req.body.mid;
//   var lvid = req.body.lvid;
//   var image = req.body.image;

//   console.log((new Date()).toTimeString(), {'action':'read', 'pid':pid, 'mid':mid, 'lvid':lvid});

//   client.get(['machine', mid].join('-'), function(error, ip) {
//     if(ip) {
//       var postOptions = {
//         host: ip.toString(), 
//         path: '/upload',
//         port: 8080,
//         method: 'POST'
//       };
//       var postData = {
//         'mid': mid,
//         'lvid': lvid,
//         'pid': pid,
//         'image': image
//       }
      
//       var postReq = http.request(postOptions, function(res) {
//         res.setEncoding('utf8');
//         res.on('data', function(chunk) {
//           console.log('Response:' + chunk);
//         });
//       });
//       postReq.write(postData);
//       postReq.end();

//       // Cache the image in the Redis.
//       client.setex(pid, 120, image);
//     } else {
//       console.log("Cannot find the IP of machine " + mid +' '+ err);
//     }
//   });
// });

// // Delete image.
// app.post('/delete', function(req, res) {
//   var pid = req.body.pid;
//   var mid = req.body.mid;
//   var lvid = req.body.lvid;

//   console.log((new Date()).toTimeString(), {'action':'read', 'pid':pid, 'mid':mid, 'lvid':lvid});

//   client.get(['machine', mid].join('-'), function(error, ip) {
//     if(ip) {
//       var postOptions = {
//         host: ip.toString(), 
//         path: '/upload',
//         port: 8080,
//         method: 'POST'
//       };
//       TODO

//       }
//     } else {
//       console.log("Cannot find the IP of machine " + mid +' '+ err);
//     }
//   });
// });

app.listen(app.get('port'), function() {
  console.log('Server listening on port: ', app.get('port'));
});
