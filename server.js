
/**
 * Module dependencies.
 */

var express = require('express')
		sio = require('socket.io')
		MemoryStore = express.session.MemoryStore
		sessionStore = new MemoryStore()
		parseCookie = require('connect').utils.parseCookie

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
	app.use(express.cookieParser());
	app.use(express.session({secret:'secret',store:sessionStore}));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
	console.log('controller:%s',req.session.controller);
	res.render('index',{layout:false,controller:req.session.controller});
});
app.get('/controller',function(req, res){
	req.session.controller = true;
	res.redirect('/');
});

app.get('/logout',function(req, res){
	delete req.session.controller;
	res.redirect('/');
});
app.listen(process.env.PORT || 3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);


var io = sio.listen(app);

io.configure(function(){
	io.set('authorization',function(handshakeData, callback){
		if(handshakeData.headers.cookie){
			var cookie = handshakeData.headers.cookie;
			var sessionID = parseCookie(cookie)['connect.sid'];
			handshakeData.sessionID = sessionID;
		} else {
			return callback('unknown cookie');
		}
		return callback(null, true);
	});
});

io.sockets.on('connection',function(socket){
	(function(){
		sessionStore.get(socket.handshake.sessionID, function(err, esession){
			if(err){require('util').log(err); return false};
			console.log(esession);
			socket.session = esession;
		});
	})();
	console.log(socket.session);
	console.log('connection');
	socket.on('go',function(to){
		console.log('socket.iosession:%s',socket.session.controller);
		socket.broadcast.emit('go',to);
	});
	socket.on('msg',function(msg){
		io.sockets.emit('msg',msg);
	});
});
