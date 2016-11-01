// require the dependencies we installed
const app = require('express')();
const responseTime = require('response-time');
const shuffle = require('shuffle-array');

const cassandra = require('cassandra-driver');
const db_client = new cassandra.Client({
  contactPoints: ['172.20.0.4'],
  keyspace: 'photo'
});
db_client.connect(function(err) {
  if (err) console.log("Error " + err);
});


app.set('port', (process.env.PORT || 80));

// set up the response-time middleware
app.use(responseTime());

app.set('view engine', 'pug');

photo_num = 5;
url = "http://localhost:8080/photo/"

app.get('/', (req, res) => {
  var num = 3;
  // randomly generate $num photoids to simulate a dynamic webpage
  // and generate corresponding query
  var ids = shuffle(Array.apply(null, Array(5)).map(function(_, i) {
    return i + 1;
  })).slice(0, num);
  console.log(ids);
  var query = 'SELECT pindex FROM photo WHERE pid IN ( ? ';
  for (var i = 1; i < num; i++) {
    query += ', ? ';
  }
  query += ' )';

  // console.log(query);

  db_client.execute(query, ids, {
    prepare: true
  }, function(err, result) {
    if (err) console.log("Error " + err);

    var photo_paths = new Array(num);
    for (var i = 0; i < num; i++) {
      photo_paths[i] = url + result.rows[i].pindex;
    }

    res.render('index', {
      title: 'Comic Gallery',
      photo_paths: photo_paths,
    });
  });
});

app.get('/photo/:name/', (req, res) => {
  // stored photo names
  const stores = {
    'first': 1,
    'second': 2,
  };

  const query = 'SELECT pindex FROM photo WHERE pid = ' + stores[req.params.name];

  db_client.execute(query, {prepare: true}, (err, result) => {
    if (err) console.log(err);

    const photo_path = url + result.rows[0].pindex;
    res.render('photo', {
      title: req.params.name,
      photo_path: photo_path,
    });
  });
});

app.listen(app.get('port'), function() {
  console.log('Server listening on port: ', app.get('port'));
});
