var express = require('express'),
    app = express(),
    http = require("http"),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    RedisStore = require('connect-redis')(session);

var server=http.createServer(app);

app.use(express.static(__dirname + '/public'));
app.use(function(req, res, next) {
  if (~req.url.indexOf('favicon'))
    return res.send(404);
  next();
});
app.use(cookieParser());
app.use(session({
  store: new RedisStore({
    // this is the default prefix used by redis-session-php
    //var redisClient = redis.createClient('redis://128.4.27.23:6379');
    host: '128.4.27.23',
    port: 6379,
    prefix: 'session:php:'
  }),
  // use the default PHP session cookie name
  name: 'PHPSESSID',
  secret: 'node.js rules',
  resave: false,
  saveUninitialized: false
}));
app.use(function(req, res, next) {
  req.session.nodejs = 'Hello from node.js!';
  res.send('<pre>' + JSON.stringify(req.session, null, '    ') + '</pre>');
});

server.listen(3000, "0.0.0.0", function(){
  var addr = server.address();
  console.log("Quick stack backend listening at", addr.address + ":" + addr.port);
});