function init(){map=new OpenLayers.Map("map"),map.addControl(new OpenLayers.Control.LayerSwitcher);var e=new OpenLayers.Layer.Google("Google Physical",{type:google.maps.MapTypeId.TERRAIN}),t=new OpenLayers.Layer.Google("Google Streets",{numZoomLevels:20}),n=new OpenLayers.Layer.Google("Google Hybrid",{type:google.maps.MapTypeId.HYBRID,numZoomLevels:20}),r=new OpenLayers.Layer.Google("Google Satellite",{type:google.maps.MapTypeId.SATELLITE,numZoomLevels:22});map.addLayers([e,t,n,r]),map.setCenter((new OpenLayers.LonLat(10.2,48.9)).transform(new OpenLayers.Projection("EPSG:4326"),map.getProjectionObject()),5);var i=document.getElementById("animate");i.onclick=function(){for(var e=map.layers.length-1;e>=0;--e)map.layers[e].animationEnabled=this.checked}}var map;