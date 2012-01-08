
/**
 * Module dependencies.
 */

var express = require('express')
		sio = require('socket.io')

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
	app.use(express.cookieParser());
	app.use(express.session({secret:'secret'}));
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

io.sockets.on('connection',function(socket){
	console.log('connection');
	socket.on('go',function(to){
		socket.broadcast.emit('go',to);
	});
	socket.on('msg',function(msg){
		io.sockets.emit('msg',msg);
	});
});
