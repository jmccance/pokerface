$(function() {
 
    var socket = io.connect('//');
    var joinButton = document.getElementById("join");
    var identitySection = document.getElementById("identity");

    var field = document.getElementById("field");
    var sendButton = document.getElementById("send");
    var content = document.getElementById("content");
    var name = document.getElementById("name");
 
    socket.on('updateusers', function (data) {
        var source;
        if (data.reveal) {
            source = $('#participants-template-reveal').html();
        } else {
            source = $('#participants-template-conceal').html();
        }
        var template = Handlebars.compile(source);
        var content = template({items: data.estimates});
        $('#content').html(content);
        $('#conceal-reveal').val(data.reveal ? 'Conceal' : 'Reveal');
    });

    $("#join").click(function() {
        if(name.value == "") {
            alert("Please type your name!");
        } else {
            socket.emit('join', { username: name.value });
            $('#identity').hide();
            $('#estimate').show();
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
            $this.val('Reveal');
        } else {
            socket.emit('reveal');
            $this.val('Conceal');
        }
    });

    $('#clear').click(function() {
        socket.emit('clear-estimates');
    });
 
});
