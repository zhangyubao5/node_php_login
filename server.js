var fs = require("fs");
var file = "/var/www/html/secure_login_php/auth.sqlite";
var exists = fs.existsSync(file);

var sqlite3 = require("sqlite3").verbose();
var sqlite_db = new sqlite3.Database(file);

var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/quickstack');

var genericSchema = new mongoose.Schema({}, { strict: false });

var createDoc = function(document, collection, callback){
  var Model = mongoose.model('Model', genericSchema, collection);
  Model.create(document, function(err, document){
    if(!err){
      callback(document);
    }
  });
};

var findDocs = function(collection, filter, callback){
  var Model = mongoose.model('Model', genericSchema, collection);
  Model.find(filter).exec(function(err, documents){
    if (!err){
      callback(documents);
    }
  });
};

var updateDoc = function(collection, id, changes, callback){
  var Model = mongoose.model('Model', genericSchema, collection);
  Model.update({_id: id}, {$set: changes}, function(err, document){
    if (!err){
      callback(document);
    }
  });
};

var deleteDoc = function(collection, id, callback){
  var Model = mongoose.model('Model', genericSchema, collection);
  Model.findByIdAndRemove(id, function(err, document){
    if (!err){
      callback(document);
    }
  });
};

var express = require('express');
var cookieParser = require("cookie-parser");
var PHPUnserialize = require('php-unserialize');
var redis = require("redis");
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');

var redisClient = redis.createClient('redis://128.4.27.23:6379');

redisClient.on('connect', function(){
  console.log("Redis connected");
});

redisClient.on('error', function(err){
  console.log("Error: "+err);
});

var session = require("express-session");
var RedisStore = require('connect-redis')(session);

var router = express();
var server = http.createServer(router);
var session_id = null;
//var session=null;
router.use(bodyParser.json());
router.use(cookieParser());
router.use(session({
  store: new RedisStore({
    // this is the default prefix used by redis-session-php
    prefix: 'session:php:',
    client: redisClient
  }),
  // use the default PHP session cookie name
  name: 'PHPSESSID',
  secret: 'node.js rules',
  resave: false,
  saveUninitialized: false
}));

router.use(express.static(path.resolve(__dirname, 'client')));

// router.use(function(req, res, next) {
//   console.log(req.session);
//   //if (!req.session || !req.session.logged_in || !(req.session.logged_in===true)) {
//   //   console.log("redirect to login page.");
//   //   res.writeHead(200, {Location: "http://128.4.27.23:8080/secure_login_php/"});
//   //   res.end();
//   // } else {
//     res.cookie("username", req.session.username);
//     res.cookie("roleid", req.session.roleid);
//   //}
//   //next();
// });

router.use(function(req, res, next){
  if (req.session && req.session.logged_in===true) {
    res.cookie("username", req.session.username);
    res.cookie("roleid", req.session.roleid);
  } else {
    console.log("process exit");
    process.exit(1);
  }
  next();
});

var sql;

router.get('/:collection', function(req, res){
  //console.log(req.session);
  //console.log("Get collection: "+req.params.collection +" with role id "+req.session.roleid);
  var collection = req.params.collection;
  //admin: all, moderator: author and posts, author: posts, reader: posts and comments
  //console.log();

  switch (req.session.roleid) {
    case '1': 
      if (collection==="users") {
        //console.log("admin request users");
        sql = "select username, rolename from users join roles on users.roleid=roles.roleid;";
        sqlite_db.all(sql, function(err, all){
          if (!err) {
            res.json(all);
          };
        });
      }else {
        findDocs(collection, {}, function(docs){
          res.json(docs);
        });
      }
      break;
    case '2':
      if (collection==="users" || collection==="topics" || collection==="articles" || collection==="favicon.ico") {
        if (collection=="users") {
          sql = "select username, rolename from users join roles on users.roleid=roles.roleid;";
          sqlite_db.all(sql, function(err, all){
            if (!err) {
              res.json(all);
            };
          });
        } else {
          findDocs(collection, {}, function(docs){
            res.json(docs);
          });
        }
      }else {
        res.json({ permissionerror: '1' });
      }
      break;
    case '3':
      if (collection=="articles" || collection=="favicon.ico") {
        findDocs(collection, {}, function(docs){
          res.json(docs);
        });
      }else {
        res.json({ permissionerror: '1' });
      }
      break;
    case '4':
      //console.log("reader operations");
      if (collection=='topics' || collection=="articles" || collection=="comments" || collection=="favicon.ico") {
        findDocs(collection, {}, function(docs){
          res.json(docs);
        });
      } else {
        res.json({ permissionerror: '1' });
      }
      break;

    default:
      res.json({ permissionerror: '1' });
      break;

  }
  
  
})
.get('/:collection/:id', function(req, res){
  var collection = req.params.collection;
  var id = req.params.id;
  //admin: all, moderator: author and posts, author: posts, reader: posts and comments
  // findDocs(collection, {_id: id}, function(docs){
  //   res.json(docs);
  // });
  switch (req.session.roleid) {
    case '1': 
      findDocs(collection, {_id: id}, function(docs){
        res.json(docs);
      });
      break;
    case '2':
      if (collection==="users" || collection==="topics" || collection==="articles" || collection==="favicon.ico") {
        findDocs(collection, {_id: id}, function(docs){
          res.json(docs);
        });
      }else {
        res.json({ permissionerror: '1' });
      }
      break;
    case '3':
      if (collection=="articles" || collection=="favicon.ico") {
        findDocs(collection, {_id: id}, function(docs){
          res.json(docs);
        });
      }else {
        res.json({ permissionerror: '1' });
      }
      break;
    case '4':
      //console.log("reader operations");
      if (collection=='topics' || collection=="articles" || collection=="comments" || collection=="favicon.ico") {
        findDocs(collection, {_id: id}, function(docs){
          res.json(docs);
        });
      }else {
        res.json({ permissionerror: '1' });
      }
      break;

    default:
      res.json({ permissionerror: '1' });
      break;

  }

})
.post('/:collection', function(req, res){
  var collection = req.params.collection;
  //admin: all, moderator: author and posts, author: posts, reader: comments
  // createDoc(req.body, collection, function(document){
  //   res.json(document);
  // });

  switch (req.session.roleid) {
    case '1': 
      createDoc(req.body, collection, function(document){
        res.json(document);
      });
      break;
    case '2':
      if (collection==="users" || collection==="topics" || collection==="articles" || collection==="favicon.ico") {
        createDoc(req.body, collection, function(document){
          res.json(document);
        });
      };
      break;
    case '3':
      if (collection=="articles" || collection=="favicon.ico") {
        createDoc(req.body, collection, function(document){
          res.json(document);
        });
      };
      break;
    case '4':
      console.log("reader operations");
      if (collection=="comments" || collection=="favicon.ico") {
        createDoc(req.body, collection, function(document){
          res.json(document);
        });
      };
      break;

    default:
      break;

  }

})
.put('/:collection/:id', function(req, res){
  var collection = req.params.collection;
  //admin: all, moderator: author and posts, author: posts, reader: comments
  var id = req.params.id;
  // updateDoc(collection, id, req.body, function(document){
  //   res.json(document);
  // });

  switch (req.session.roleid) {
    case '1': 
      if (collection=="users") {
        sql = "update users set roleid=5 where username=?;";
        sqlite_db.run(sql, id, function(err, row){
          if (err){
              console.err(err);
              res.status(500);
          }
          else {
              res.status(202);
          }
          res.end();
        });
      } else {
        updateDoc(collection, id, req.body, function(document){
          res.json(document);
        });
      }
      break;
    case '2':
      if (collection==="users" || collection==="topics" || collection==="articles" || collection==="favicon.ico") {
        if (collection=="users") {
          sql = "update users set roleid=5 where username=?;";
          sqlite_db.run(sql, id, function(err, row){
            if (err){
                console.err(err);
                res.status(500);
            }
            else {
                res.status(202);
            }
            res.end();
          });
        } else {
          updateDoc(collection, id, req.body, function(document){
            res.json(document);
          });
        }
      };
      break;
    case '3':
      if (collection=="articles" || collection=="favicon.ico") {
       updateDoc(collection, id, req.body, function(document){
          res.json(document);
        });
      };
      break;
    case '4':
      //console.log("reader operations");
      if (collection=="comments" || collection=="favicon.ico") {
        updateDoc(collection, id, req.body, function(document){
          res.json(document);
        });
      };
      break;

    default:
      break;

  }


})
.delete('/:collection/:id', function(req, res){
  var collection = req.params.collection;
  //admin: all, moderator: author and posts, author: posts, reader: comments
  var id = req.params.id;
  // deleteDoc(collection, id, function(document){
  //   res.json(document);
  // });

switch (req.session.roleid) {
    case '1': 
      deleteDoc(collection, id, function(document){
        res.json(document);
      });
      break;
    case '2':
      if (collection==="topics" || collection==="articles" || collection==="favicon.ico") {
        deleteDoc(collection, id, function(document){
          res.json(document);
        });
      };
      break;
    case '3':
      if (collection=="articles" || collection=="favicon.ico") {
       deleteDoc(collection, id, function(document){
          res.json(document);
        });
      };
      break;
    case '4':
      //console.log("reader operations");
      if (collection=="comments" || collection=="favicon.ico") {
        deleteDoc(collection, id, function(document){
          res.json(document);
        });
      };
      break;

    default:
      break;

  }

});

server.listen(3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Node Server listening at", addr.address + ":" + addr.port);
});