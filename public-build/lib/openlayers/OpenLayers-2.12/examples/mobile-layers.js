function init(){map=new OpenLayers.Map({div:"map",theme:null,controls:[new OpenLayers.Control.Attribution,new OpenLayers.Control.TouchNavigation({dragPanOptions:{enableKinetic:!0}}),new OpenLayers.Control.Zoom]});var e=new OpenLayers.Layer.WMS("OpenLayers WMS","http://vmap0.tiles.osgeo.org/wms/vmap0",{layers:"basic"},{isBaseLayer:!0,transitionEffect:"resize"}),t=new OpenLayers.Layer.Vector("KML",{projection:map.displayProjection,strategies:[new OpenLayers.Strategy.Fixed],protocol:new OpenLayers.Protocol.HTTP({url:"kml/sundials.kml",format:new OpenLayers.Format.KML({extractStyles:!0,extractAttributes:!0})}),renderers:renderer}),n=new OpenLayers.Layer.Vector("States",{strategies:[new OpenLayers.Strategy.Fixed],protocol:new OpenLayers.Protocol.WFS({url:"http://demo.opengeo.org/geoserver/wfs",featureType:"states",featureNS:"http://www.openplans.org/topp"}),renderers:renderer});map.addLayers([e,n,t]),map.setCenter(new OpenLayers.LonLat(-104,42),3)}var map,fixSize=function(){window.scrollTo(0,0),document.body.style.height="100%",/(iphone|ipod)/.test(navigator.userAgent.toLowerCase())||document.body.parentNode&&(document.body.parentNode.style.height="100%")};setTimeout(fixSize,700),setTimeout(fixSize,1500);var renderer=OpenLayers.Util.getParameters(window.location.href).renderer;renderer=renderer?[renderer]:OpenLayers.Layer.Vector.prototype.renderers,OpenLayers.ProxyHost="proxy.cgi?url=";