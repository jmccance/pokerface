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

var getEstimates = function() {
	var estimates = [];
	var keys = Object.keys(_sockets);
	for (var i = 0; i < keys.length; i++) {
		if (_sockets[keys[i]].username) {
			estimates.push({
				name: _sockets[keys[i]].username,
				estimate: revealed ? _sockets[keys[i]].estimate : '-',
				estimated: _sockets[keys[i]].estimated
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
		io.sockets.emit('updateusers', getEstimates());		
	});

	socket.on('estimate', function(data) {
		socket.estimate = data.estimate;
		socket.estimated = !!(socket.estimate);
		io.sockets.emit('updateusers', getEstimates());		
	});

	socket.on('conceal', function() {
		revealed = false;
		io.sockets.emit('updateusers', getEstimates());		
	});

	socket.on('reveal', function() {
		revealed = true;
		io.sockets.emit('updateusers', getEstimates());		
	});

	socket.on('clear-estimates', function() {
		revealed = false;
		var keys = Object.keys(_sockets);
		for (var i = 0; i < keys.length; i++) {
			_sockets[keys[i]].estimate = '';
			_sockets[keys[i]].estimated = false;
		}		
		io.sockets.emit('updateusers', getEstimates());		
	});
	
	socket.on('disconnect', function() {
		delete _sockets[socket.id];
	});

	io.sockets.emit('updateusers', getEstimates());
});
