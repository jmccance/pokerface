$(function() {
 
    var socket = io.connect('//');
        console.log(socket);

    socket.on('data', function (data) {
        var source;
        if (data.reveal) {
            source = $('#participants-template-reveal').html();
        } else {
            source = $('#participants-template-conceal').html();
        }
        var template = Handlebars.compile(source);
        var content = template({items: data.estimates});

        if (data.host == socket.socket.sessionid) {
            $('#host').show();
        } else {
            $('#host').hide();
        }
        $('#content').html(content);
        $('#conceal-reveal').val(data.reveal ? 'Conceal' : 'Reveal');
    });

    socket.on('room-closed', function() {
        $('#content').hide();
        $('#estimate').hide();
        $('#identity').show();
        alert('The room has been closed by the host.');
    });

    $('#room,#name').keypress(function(e) {
        if (e.which == 13) {
            $('#join').click();
        }
    });

    $("#join").click(function() {
        var name = $('#name').val();
        var room = $('#room').val();
        if(room == "") {
            alert("Please enter a room");
            return;
        }
        if(name == "") {
            alert("Please enter your name");
            return;
        }

        socket.emit('join', { 
            username: name, 
            room: room 
        });
        $('#identity').hide();
        $('#estimate').show();
        $('#content').show();
    });
 
    $('#estimate-input').keypress(function(e) {
        if (e.which == 13) {
            $('#send').click();
        }
    });

    $('#send').click(function() {
        socket.emit('estimate', {
            estimate: $('#estimate-input').val()
        });
        $('#estimate-input').val('');
    });

    $('#conceal-reveal').click(function() {
        var $this = $(this);
        if ($this.val() == 'Conceal') {
            socket.emit('conceal');
        } else {
            socket.emit('reveal');
        }
    });

    $('#clear').click(function() {
        socket.emit('clear-estimates');
    });
 
    // every minute or so, hit the server just so 
    // we can keep the connection alive
    // we wouldn't need this if our web host supported
    // websockets properly
    var heartbeat = function() {
        $('#heartbeat-icon').fadeIn();
        $.ajax({
            url: 'heartbeat',
            success: function() {
                setTimeout(function() {
                    $('#heartbeat-icon').fadeOut();
                }, 1000);
            }
        });
        setTimeout(heartbeat, 60000);
    };

    heartbeat();
});
