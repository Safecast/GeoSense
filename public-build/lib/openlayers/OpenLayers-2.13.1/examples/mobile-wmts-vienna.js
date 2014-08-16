var map;(function(){function h(){var e=f.tileFullExtent,t=e.getCenterLonLat(),n=map.getZoomForExtent(e,!0),r=OpenLayers.Util.getParameters("?"+window.location.hash.substr(1));OpenLayers.Util.applyDefaults(r,{x:t.lon,y:t.lat,z:n}),map.setCenter(new OpenLayers.LonLat(r.x,r.y),r.z)}document.documentElement.lang=(navigator.userLanguage||navigator.language).split("-")[0];var e=new OpenLayers.Control.Panel({displayClass:"layerPanel",autoActivate:!0}),t=new OpenLayers.Control({type:OpenLayers.Control.TYPE_TOOL,displayClass:"aerialButton",eventListeners:{activate:function(){l&&map.setBaseLayer(l)}}}),n=new OpenLayers.Control({type:OpenLayers.Control.TYPE_TOOL,displayClass:"mapButton",eventListeners:{activate:function(){f&&map.setBaseLayer(f)}}}),r=new OpenLayers.Control({type:OpenLayers.Control.TYPE_TOGGLE,displayClass:"labelButton",eventListeners:{activate:function(){c&&c.setVisibility(!0)},deactivate:function(){c&&c.setVisibility(!1)}}});e.addControls([t,n,r]);var i=new OpenLayers.Control.ZoomPanel,s=new OpenLayers.Control.Geolocate({type:OpenLayers.Control.TYPE_TOGGLE,bind:!1,watch:!0,geolocationOptions:{enableHighAccuracy:!1,maximumAge:0,timeout:7e3},eventListeners:{activate:function(){map.addLayer(u)},deactivate:function(){map.removeLayer(u),u.removeAllFeatures()},locationupdated:function(e){u.removeAllFeatures(),u.addFeatures([new OpenLayers.Feature.Vector(e.point,null,{graphicName:"cross",strokeColor:"#f00",strokeWidth:2,fillOpacity:0,pointRadius:10}),new OpenLayers.Feature.Vector(OpenLayers.Geometry.Polygon.createRegularPolygon(new OpenLayers.Geometry.Point(e.point.x,e.point.y),e.position.coords.accuracy/2,50,0),null,{fillOpacity:.1,fillColor:"#000",strokeColor:"#f00",strokeOpacity:.6})]),map.zoomToExtent(u.getDataExtent())}}});i.addControls([s]);var o=new OpenLayers.Layer.OSM;map=new OpenLayers.Map({div:"map",theme:null,projection:"EPSG:3857",units:"m",maxResolution:38.21851413574219,numZoomLevels:8,controls:[new OpenLayers.Control.Navigation,new OpenLayers.Control.Attribution,i,e],eventListeners:{moveend:function(){var e=map.getCenter();window.location.hash="x="+e.lon+"&y="+e.lat+"&z="+map.getZoom(),map.getExtent().intersectsBounds(f.tileFullExtent)?map.baseLayer===o&&map.removeLayer(o):map.baseLayer!==o&&(map.addLayer(o),map.setBaseLayer(o))}}}),e.activateControl(n),e.activateControl(r);var u=new OpenLayers.Layer.Vector("Vector Layer"),a={zoomOffset:12,requestEncoding:"REST",matrixSet:"google3857",attribution:'Datenquelle: Stadt Wien - <a href="http://data.wien.gv.at">data.wien.gv.at</a>'},f,l,c;OpenLayers.ProxyHost="proxy.cgi?url=",OpenLayers.Request.GET({url:"http://maps.wien.gv.at/wmts/1.0.0/WMTSCapabilities.xml",success:function(e){var t=new OpenLayers.Format.WMTSCapabilities,n=e.responseText,r=t.read(n);f=t.createLayer(r,OpenLayers.Util.applyDefaults({layer:"fmzk"},a)),l=t.createLayer(r,OpenLayers.Util.applyDefaults({layer:"lb"},a)),c=t.createLayer(r,OpenLayers.Util.applyDefaults({layer:"beschriftung",isBaseLayer:!1,transitionEffect:"map-resize"},a)),map.addLayers([f,l,c]),h()}})})(),function(){var e=document.getElementById("map"),t=navigator.userAgent,n=~t.indexOf("iPhone")||~t.indexOf("iPod"),r=~t.indexOf("iPad"),i=n||r,s=window.navigator.standalone,o=~t.indexOf("Android"),u=0;o&&(window.onscroll=function(){e.style.height=window.innerHeight+"px"});var a=window.onload=function(){if(i){var t=document.documentElement.clientHeight;n&&!s&&(t+=60),e.style.height=t+"px"}else o&&(e.style.height=window.innerHeight+56+"px");setTimeout(scrollTo,0,0,1)};(window.onresize=function(){var t=e.offsetWidth;if(u==t)return;u=t,a()})()}();