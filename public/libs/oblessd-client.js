jQuery(document).ready(function($) {
    var Socket = "MozWebSocket" in window ? MozWebSocket : WebSocket;
    var ws = new Socket("ws://18.85.58.21:8080/");

    var initialLoc; 

    ws.onmessage = function(evt) { 
      var obj = $.parseJSON(evt.data);
      if (!initialLoc) {
      	initialLoc = obj["Object-05"].loc;
      }
      if (THREEx && THREEx.world) {
      	var newLoc = obj["Object-05"].loc;

      	var f = 100;
      	THREEx.world.position = new THREE.Vector3(
      		(newLoc[0] - initialLoc[0]) * f, (newLoc[1] - initialLoc[1]) * f, (newLoc[2] - initialLoc[2]) * f
      	);
      }
    };
});
