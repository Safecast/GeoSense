function updateOutput(e){window.setTimeout(function(){output.innerHTML=e.type+" "+e.feature.id},100)}function toggleControl(e){e.value==="polygon"&&e.checked?draw.activate():draw.deactivate()}var renderer=OpenLayers.Util.getParameters(window.location.href).renderer;renderer=renderer?[renderer]:OpenLayers.Layer.Vector.prototype.renderers;var map=new OpenLayers.Map({div:"map",layers:[new OpenLayers.Layer.OSM,new OpenLayers.Layer.Vector("Vector Layer",{renderers:renderer})],center:new OpenLayers.LonLat(0,0),zoom:1}),draw=new OpenLayers.Control.DrawFeature(map.layers[1],OpenLayers.Handler.Polygon,{handlerOptions:{holeModifier:"altKey"}});map.addControl(draw);var output=document.getElementById("output");map.layers[1].events.on({sketchmodified:updateOutput,sketchcomplete:updateOutput}),document.getElementById("noneToggle").checked=!0;