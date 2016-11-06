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


const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');

app.set('port', (process.env.PORT || 80));

// set up the response-time middleware
app.use(responseTime());

app.set('view engine', 'pug');

class UrlBuilder {
  query(pid, resolve) {
    const query = 'SELECT * FROM photo WHERE pid = ' + pid;
    // no promise support for cassandra client
    db_client.execute(query, {prepare: true}, (err, result) => {
        if (err) console.log(err);

        const row = result.rows[0];
        // driver exposes list/set as native Arrays
        const mid = this._arrayRandom(row.mid);
        const photo_path = this.build(row.pid, row.cache_url, mid, row.lvid);
        resolve(photo_path);
      }
    );
  }

  _arrayRandom(xs) {
    return xs[Math.floor(Math.random()*xs.length)];
  }

  randomQuery(num, resolve) {
    const photo_num = 5;
    // randomly generate $num photoids to simulate a dynamic webpage
    // and generate corresponding query
    var ids = shuffle(Array.apply(null, Array(photo_num)).map(function(_, i) {
      return i + 1;
    })).slice(0, num);
    var query = 'SELECT * FROM photo WHERE pid IN ( ? ';
    for (var i = 1; i < num; i++) {
      query += ', ? ';
    }
    query += ' )';

    db_client.execute(query, ids, {
      prepare: true
    }, (err, result) => {
      if (err) console.log("Error " + err);

      let photo_paths = new Array(num);
      for (var i = 0; i < num; i++) {
        const row = result.rows[i];
        const mid = this._arrayRandom(row.mid);
        const photo_path = this.build(row.pid, row.cache_url, mid, row.lvid);
        photo_paths[i] = photo_path;
      }

      resolve(photo_paths);
    });
  }

  build(pid, cacheUrl, machineId, logicialVolId) {
    // sample: http://localhost:8080/machineId/logicialVolId/pid
    const url = "http://" + [cacheUrl, machineId, logicialVolId, pid].join("/");
    return url;
  }
}

app.get('/', (req, res) => {
  var num = 3;
  const builder = new UrlBuilder();
  builder.randomQuery(num, (photo_paths) => {
    res.render('index', {
      title: 'Comic Gallery',
      photo_paths: photo_paths,
    });
  });
});

app.get('/upload/', (req, res) => {
  res.render('upload', { title: "Upload Photo" });
});

app.post('/photo/', upload.single('image'), (req, res) => {
  console.log(req);
  fs.readFile(req.file.path, (err, data) => {
    let image = new Buffer(data).toString('base64');
    // TODO handle image base64;
    res.end('uploaded');
  });
});

app.get('/photo/:photoid', (req, res) => {
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
