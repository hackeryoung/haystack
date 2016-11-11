const app = require('express')();
var request = require('request');
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
const upload = multer({
  dest: 'uploads/',
  inMemory: true
});
const fs = require('fs');


// TODO: pids management
var photo_num = 5;


app.set('port', (process.env.PORT || 80));

// set up the response-time middleware
app.use(responseTime());

app.set('view engine', 'pug');

class UrlBuilder {
  query(pid, resolve) {
    const query = 'SELECT * FROM photo WHERE pid = ' + pid;
    // no promise support for cassandra client - bluebird promise
    db_client.execute(query, {prepare: true}, (err, result) => {
        if (err) console.log(err);

        const row = result.rows[0];
        // driver exposes list/set as native Arrays
        const mid = UrlBuilder._arrayRandom(row.mid);
        const photo_path = this.build(row.pid, row.cache_url, mid, row.lvid);
        resolve(photo_path);
      }
    );
  }

  static _arrayRandom(xs) {
    return xs[Math.floor(Math.random()*xs.length)];
  }

  randomQuery(num, resolve) {
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
        const mid = UrlBuilder._arrayRandom(row.mid);
        const photo_path = this.build(row.pid, row.cache_url, mid, row.lvid);
        photo_paths[i] = photo_path;
      }

      resolve(photo_paths);
    });
  }

  build(pid, cacheUrl, machineId, logicialVolId) {
    // sample: http://localhost:8080/machineIdBase64/logicialVolId/pid
    const machineIdBase64 = new Buffer(machineId).toString('base64');
    cacheUrl = "127.0.0.1:8080";  // exposed port of cache to client
    const url = "http://" + [cacheUrl, machineIdBase64, logicialVolId, pid].join("/");
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
  var pid = (++photo_num);  // TODO, select the largest count from cassandra
  // ask Directory for writable logical volumns
  var lvid_query = "SELECT lvid, mid FROM store WHERE status = 1 LIMIT 5 ALLOW FILTERING";
  db_client.execute(lvid_query, [], { prepare: true }, (err, result) => {
    if (err) console.error("Error: ", err);

    let entry = UrlBuilder._arrayRandom(result.rows);
    let lvid = entry.lvid;

    const insert_query = "INSERT INTO photo (pid, cache_url, mid, lvid) VALUES (?, '127.0.0.1:8080', ?, ?);";
    db_client.execute(insert_query, [pid, entry.mid, lvid], { prepare: true }, (err) => {
      if (err) {
        console.error("Error: ", err);
        res.status(400).end(err);
      } else {
        console.log("Uploading to store");
        // Write to store machines
        const formData = {
          'image': fs.createReadStream(req.file.path),
        };
        const promises = entry.mid.map((mid) => {
          return new Promise((resolve, reject) => {
            request.post({
              url: 'http://' + [mid, lvid, pid, 'gif'].join('/'),  // TODO get file type from user upload
              formData: formData,
            }, (err, response, body) => {
              if (err) {
                reject(err);
              } else {
                const msg = "Uploaded as pid: " + pid;
                resolve(msg);
              }
            });
          });
        });

        Promise.all(promises)
            .then((msgs) => {  // resolve iterable
              msgs.map((msg) => console.log(msg));
              res.end("Photo uploaded successfully")
            })
            .catch((err) => {
              console.error("Uploaded fail: ", err);
              res.status(400).end(err)
            });
      }
    });
  });
});

app.delete('/photo/:photoid', (req, res) => {
  const pid = req.params.photoid;
  redis_client.del(pid);
  const query = "SELECT pid, cache_url, mid, lvid FROM photo WHERE pid = " + pid;
  db_client.execute(query, {prepare: true}, (err, result) => {
    if (err) console.log(err);

    const row = result.rows[0];
    if (!row) {
      res.send("No key found, pid: " + pid).end();
      return;
    }

    /*
    const update = "DELETE FROM photo WHERE pid = " + row.pid;
    db_client.execute(update, {prepare: true}, (err, result) => {
      if (err) console.error(err);
    });
    */
    // Query cache to invalidate
    const redis_promise = new Promise((resolve, reject) => {
      request.delete({
        url: 'http://' + [row.cache_url, row.pid].join('/'),
      }, (err, response, body) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          console.log("Cache: " + body);
          resolve();
        }
      });
    });

    // Query store machine to delete
    const promises = [];
    for (let ip of row.mid) {
      const url = 'http://' + [ip, row.lvid, row.pid].join('/');
      promises.push(
        new Promise((resolve, reject) => {
          request.delete({
            url: url,
          }, (err, response, body) => {
            if (err) {
              console.error(err);
              reject(err);
            } else {
              console.log("Store: " + body);
              resolve();
            }
          });
        })
      );
    }

    promises.push(redis_promise);
    Promise.all(promises)
        .then(() => res.send("Photo on all cache and stores deleted"))
        .catch((err) => console.log(err));
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
