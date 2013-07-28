var express = require("express");
var app = express();
var port = 3700;
 
 
app.use(express.static(__dirname + '/public'));

app.get("/", function(req, res){
    res.render("index.html");
});


// clients which are currently connected to the app
var _sockets = {};
var revealed = false;

var io = require('socket.io').listen(app.listen(port));
console.log("Listening on port " + port);

var getEstimates = function(room) {
	var estimates = [];
	var keys = Object.keys(_sockets);
	var current;
	for (var i = 0; i < keys.length; i++) {
		current = _sockets[keys[i]];
		if (current.room == room && current.username) {
			estimates.push({
				name: current.username,
				estimate: revealed ? current.estimate : '-',
				estimated: current.estimated
			});
		}
	}
	return {
		reveal: revealed,
		estimates: estimates
	};
};

io.sockets.on('connection', function (socket) {
	_sockets[socket.id] = socket;

	socket.on('join', function(data) {
		socket.username = data.username;
		socket.room = data.room;
		socket.join(data.room);
		io.sockets.in(socket.room).emit('updateusers', getEstimates(socket.room));		
	});

	socket.on('estimate', function(data) {
		socket.estimate = data.estimate;
		socket.estimated = !!(socket.estimate);
		io.sockets.in(socket.room).emit('updateusers', getEstimates(socket.room));		
	});

	socket.on('conceal', function() {
		revealed = false;
		io.sockets.in(socket.room).emit('updateusers', getEstimates(socket.room));		
	});

	socket.on('reveal', function() {
		revealed = true;
		io.sockets.in(socket.room).emit('updateusers', getEstimates(socket.room));		
	});

	socket.on('clear-estimates', function() {
		revealed = false;
		var keys = Object.keys(_sockets);
		var current;
		for (var i = 0; i < keys.length; i++) {
			current = _sockets[keys[i]];
			if (current.room == socket.room) {
				current.estimate = '';
				current.estimated = false;				
			}
		}		
		io.sockets.in(socket.room).emit('updateusers', getEstimates(socket.room));		
	});
	
	socket.on('disconnect', function() {
		delete _sockets[socket.id];
	});

	//io.sockets.emit('updateusers', getEstimates());
});
