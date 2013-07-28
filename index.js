var express = require("express");
var app = express();
var port = 3700;
 
 
app.set('views', __dirname + '/templates');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);

app.use(express.static(__dirname + '/public'));

app.get("/", function(req, res){
    res.render("page");
});


// usernames which are currently connected to the chat
var _sockets = {};


var io = require('socket.io').listen(app.listen(port));
console.log("Listening on port " + port);

var getUserNames = function() {
	var userNames = [];
	var keys = Object.keys(_sockets);
	for (var i = 0; i < keys.length; i++) {
		if (_sockets[keys[i]].username) {
			userNames.push(_sockets[keys[i]].username);
		}
	}
	return userNames;
};

io.sockets.on('connection', function (socket) {
	_sockets[socket.id] = socket;

	socket.on('join', function(data) {
		socket.username = data.username;
		io.sockets.emit('updateusers', getUserNames());		
	});

	socket.on('disconnect', function() {
		delete _sockets[socket.id];
	});

	io.sockets.emit('updateusers', getUserNames());
});
