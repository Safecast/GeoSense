jQuery(document).ready(function($) {
    var Socket = "MozWebSocket" in window ? MozWebSocket : WebSocket;
    var ws;
    var globeTag = "Object-05";
    var realWorldToVirtualFactor = 100;

    var connect = function()
    {
      ws = new Socket("ws://18.85.58.21:8080/");
      var initialGlobeLoc; 

      ws.onopen = function(evt) {
        ws.send('watch '+globeTag);
      }

      ws.onmessage = function(evt) { 
        var obj = $.parseJSON(evt.data);
        if (obj[globeTag]) {
          if (!initialGlobeLoc) {
            initialGlobeLoc = obj[globeTag].loc;
          }
          if (THREEx && THREEx.world) {
            var newLoc = obj[globeTag].loc;
            var f = realWorldToVirtualFactor;
            THREEx.world.position = new THREE.Vector3(
              (newLoc[0] - initialGlobeLoc[0]) * f, 
              (newLoc[1] - initialGlobeLoc[1]) * f, 
              (newLoc[2] - initialGlobeLoc[2]) * f
            );
          }
        }
      };

      ws.onclose = function(evt) {
        // try to reconnect after an interval
        setTimeout(connect, 2000);
      }

      ws.onerror = function(evt) {
      }
    }

    connect();
});
