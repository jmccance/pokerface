window.onload = function() {
 
    var socket = io.connect('http://localhost:3700');
    var joinButton = document.getElementById("join");
    var identitySection = document.getElementById("identity");

    var field = document.getElementById("field");
    var sendButton = document.getElementById("send");
    var content = document.getElementById("content");
    var name = document.getElementById("name");
 
    socket.on('updateusers', function (data) {
        var html = '';
        for(var i=0; i<data.length; i++) {
            html += '<b>' + data[i] + '<br />';
        }
        content.innerHTML = html;
    });

    joinButton.onclick = function() {
        if(name.value == "") {
            alert("Please type your name!");
        } else {
            socket.emit('join', { username: name.value });
        }
    };
 
    sendButton.onclick = function() {
        if(name.value == "") {
            alert("Please type your name!");
        } else {
            var text = field.value;
            socket.emit('send', { message: text, username: name.value });
        }
    };
 
}