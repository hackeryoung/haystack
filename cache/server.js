// require the dependencies we installed
const express = require('express');
const app = express();
const responseTime = require('response-time');
const redis = require('redis');
const fs = require('fs');

// create a new redis client and connect to our local redis instance
var client = redis.createClient();

// if an error occurs, print it to the console
client.on('error', function (err) {
	console.log("Error " + err);
});

// set the server listening port
app.set('port', (process.env.PORT || 8080));

// set up the response-time middleware
app.use(responseTime());

// set up static images directory
// app.use(express.static('imgs'));

// serve images in /photos/
app.get('/photo/:photoid', function(req, res) {
	var photoid = req.params.photoid;
	
	// res.sendFile(__dirname + '/imgs/phd_' + photoid + '.gif');

	// check redis cache first; if no hit, read from disk and cache it in readis
	client.get(photoid, function(error, result) {
		if (result) {		
			res.setHeader('Content-Type', 'image/gif');
			res.end(new Buffer(result, 'base64'));
			console.log((new Date()).toTimeString(), {'source': 'redis'});
		} else {
			var photo_path = __dirname + '/imgs/phd_' + photoid + '.gif';
			fs.readFile(photo_path, function(err, data) {
				if (err) console.log("Error " + err);
				res.setHeader('Content-Type', 'image/gif');
				res.end(data);
				console.log((new Date()).toTimeString(), {'source': 'dfs'});

				// set a 120 sec expiration time
				client.setex(photoid, 120, new Buffer(data).toString('base64'));
			});
		}
	});
});


app.listen(app.get('port'), function() {
	console.log('Server listening on port: ', app.get('port'));
});

