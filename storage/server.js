// require the dependencies we installed
const express = require('express');
const app = express();
const responseTime = require('response-time');
const fs = require('fs');

// set the server listening port
app.set('port', (process.env.PORT || 8080));

// set up the response-time middleware
app.use(responseTime());

app.get('/', function (req, res) {
   res.send('Hello World');
})

app.listen(app.get('port'), function() {
  console.log('Server listening on port: ', app.get('port'));
});
