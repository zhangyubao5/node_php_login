var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/quickstack');

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
  saveUninitialized: false,
  cookie: {
    path     : '/',  
    domain   : 'c9users.io',  
    httpOnly : true,  
    maxAge   : 1000*60*60*24*30*12  
  }
}));

router.use(express.static(path.resolve(__dirname, 'client')));
var sess;
router.use(function(req, res, next){
  console.log(req.session);
  sess = req.session;
  req.session.username = "fewf";
  if(session===null){
    console.log("session is null, request: "+req.query.sid);
    if(req.query && req.query.sid){
      session_id = req.query.sid;
      var keyPrefix = "PHPREDIS_SESSION:";
      // redisClient.exists(keyPrefix+req.query.sid, function(err, reply){
      //   if(reply!=1) {
      //     next("User not logged in.");
      //   } else {
      //     res.cookie("sid", req.query.sid);
      //   }
      // });
      
      redisClient.get(keyPrefix+req.query.sid, function(err, reply){
        if (err) {
          console.log(err);
          next("Session not exist.");
        }
        console.log('raw data:',reply); // show raw data
        if(reply!=null){
          session = PHPUnserialize.unserializeSession(reply); // decode session data
          console.log("session: "+session.username+";"+session.roleid); 
          //if (session.logged_in===true) {
          //  res.sendFile("ng_index.html", {root: __dirname+"/client"});
          //}
          //res.cookie("sid", session_id);
          //res.sendFile('ng_index.html', { root: path.join(__dirname, './client') });
        }
      });
    } 
  } 
  next();
});

router.get('/:collection', function(req, res){
  console.log(req.params);
  var collection = req.params.collection;
  findDocs(collection, {}, function(docs){
    res.json(docs);
  });
})
.get('/:collection/:id', function(req, res){
  var collection = req.params.collection;
  var id = req.params.id;
  findDocs(collection, {_id: id}, function(docs){
    res.json(docs);
  });
})
.post('/:collection', function(req, res){
  var collection = req.params.collection;
  createDoc(req.body, collection, function(document){
    res.json(document);
  });
})
.put('/:collection/:id', function(req, res){
  var collection = req.params.collection;
  var id = req.params.id;
  updateDoc(collection, id, req.body, function(document){
    res.json(document);
  });
})
.delete('/:collection/:id', function(req, res){
  var collection = req.params.collection;
  var id = req.params.id;
  deleteDoc(collection, id, function(document){
    res.json(document);
  });
});

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Quick stack backend listening at", addr.address + ":" + addr.port);
});