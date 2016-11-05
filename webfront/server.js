// require the dependencies we installed
const app = require('express')();
const responseTime = require('response-time');
const shuffle = require('shuffle-array');
const cassandra = require('cassandra-driver');

const redis = require('redis');
const redis_client = redis.createClient();

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
class UrlBuilder {
  query(pid, resolve) {
    const query = 'SELECT pindex FROM photo WHERE pid = ' + pid;
    // no promise support for cassandra client
    db_client.execute(query, {prepare: true}, (err, result) => {
        if (err) console.log(err);

        const pindx = result.rows[0].pindex;
        // stub TODO
        const photo_path = this.build(pindx, 'localhost:8080', 1, 1);
        resolve(photo_path);
      }
    );
  }

  build(pid, cacheUrl, machineId, logicialVolId) {
    // sample: http://localhost:8080/machineId/logicialVolId/pid
    const url = "http://" + [cacheUrl, machineId, logicialVolId, pid].join("/");
    console.log("Url built: " + url);
    return url;
  }
}

app.get('/', (req, res) => {
  var num = 3;
  const builder = new UrlBuilder();
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
      // stub TODO
      const pindex = result.rows[i].pindex;
      const photo_path = builder.build(pindex, 'localhost:8080', 1, 1);
      photo_paths[i] = photo_path
    }

    res.render('index', {
      title: 'Comic Gallery',
      photo_paths: photo_paths,
    });
  });
});

app.get('/photo/:photoid/', (req, res) => {
  const pid = req.params.photoid;
  const builder = new UrlBuilder();

  redis_client.get(pid, (err, result) => {
    if (err) console.log(err);

    if (result) {
      console.log('Cache hit');
      res.render('photo', {
        title: 'photo: ' + req.params.photoid,
        photo_path: result,
      });
    } else {
      builder.query(pid, (photo_path) => {
        redis_client.setex(pid, 120, photo_path);
        console.log('Cache updated');

        res.render('photo', {
          title: req.params.name,
          photo_path: photo_path,
        });
      });
    }
  });

});

app.listen(app.get('port'), function() {
  console.log('Server listening on port: ', app.get('port'));
});
