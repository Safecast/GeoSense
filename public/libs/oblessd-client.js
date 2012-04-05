var OblessdClient = function(options) {
    var Socket = "MozWebSocket" in window ? MozWebSocket : WebSocket;
    var ws;

    var connect = function()
    {
      ws = new Socket("ws://18.85.58.21:8080/");
      var initialGlobeLoc; 

      ws.onopen = function(evt) {
        if (options.watch) {
          for (var i = 0; i < options.watch.length; i++) {
            ws.send('watch '+options.watch[i]);
          }
        }
      }

      ws.onmessage = function(evt) { 
        var obj = $.parseJSON(evt.data);
        options.vent.trigger('updatePhysicalTags', obj);
      };

      ws.onclose = function(evt) {
        // try to reconnect after an interval
        setTimeout(connect, 2000);
      }

      ws.onerror = function(evt) {
      }
    }

    connect();
};
