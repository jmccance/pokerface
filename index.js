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
var _rooms = {};

var io = require('socket.io').listen(app.listen(port));
console.log("Listening on port " + port);

var getEstimates = function(roomId) {
	var room = _rooms[roomId];
	var estimates = [];
	var keys = Object.keys(_sockets);
	var current;
	for (var i = 0; i < keys.length; i++) {
		current = _sockets[keys[i]];
		if (current.room == roomId && current.username) {
			estimates.push({
				name: current.username,
				estimate: (room && room.revealed) ? current.estimate : '-',
				estimated: !!current.estimated
			});
		}
	}
	var hostId;
	if (room) {
		hostId = room.host;
	}
	return {
		host: hostId,
		reveal: (room && room.revealed) ? true : false,
		estimates: estimates
	};
};

io.sockets.on('connection', function (socket) {
	_sockets[socket.id] = socket;

	socket.on('join', function(data) {
		//create a room if it doesn't exist
		if (!_rooms[data.room]) {
			_rooms[data.room] = {
				id: data.room,
				host: socket.id,
				revealed: false
			};
		}

		socket.username = data.username;
		socket.room = data.room;
		socket.estimate = null;
		socket.estimated = false;
		socket.join(data.room);
		io.sockets.in(socket.room).emit('data', getEstimates(socket.room));		
	});

	socket.on('estimate', function(data) {
		socket.estimate = data.estimate;
		socket.estimated = !!(socket.estimate);
		io.sockets.in(socket.room).emit('data', getEstimates(socket.room));		
	});

	socket.on('conceal', function() {
		var room = _rooms[socket.room];
		if (room) {
			room.revealed = false;
			io.sockets.in(socket.room).emit('data', getEstimates(socket.room));		
		}
	});

	socket.on('reveal', function() {
		var room = _rooms[socket.room];
		if (room) {
			room.revealed = true;
			io.sockets.in(socket.room).emit('data', getEstimates(socket.room));		
		}
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
		io.sockets.in(socket.room).emit('data', getEstimates(socket.room));		
	});
	
	socket.on('disconnect', function() {
		var room = socket.room;
		socket.leave(socket.room);
		delete _sockets[socket.id];

		//delete the room if the host has left
		if (room) {
			var _room = _rooms[room];
			var wasHostingARoom = _room && (_room.host === socket.id);
			if (wasHostingARoom) {
				console.log('deleting room ' + room);
				delete _rooms[room];

				io.sockets.in(room).emit('room-closed');
				// now that we've told them about it,
				// force all the other sockets in the 
				// room to leave it
				var socketKeys = Object.keys(_sockets);
				for (var i = 0; i < socketKeys.length; i++) {
					var _socket = _sockets[socketKeys[i]];
					if (_socket.room == room) {
						_socket.leave(room);
						_socket.room = undefined;
					}
				}
			} else {
				console.log('sending updated data for room ' + room);
				io.sockets.in(room).emit('data', getEstimates(room));
			}
		}
	});
});
