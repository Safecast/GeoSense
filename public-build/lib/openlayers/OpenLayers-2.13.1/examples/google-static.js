var options={singleTile:!0,ratio:1,isBaseLayer:!0,wrapDateLine:!0,getURL:function(){var e=this.map.getCenter().transform("EPSG:3857","EPSG:4326"),t=this.map.getSize();return[this.url,"&center=",e.lat,",",e.lon,"&zoom=",this.map.getZoom(),"&size=",t.w,"x",t.h].join("")}},map=new OpenLayers.Map({div:"map",projection:"EPSG:3857",numZoomLevels:22,layers:[new OpenLayers.Layer.Grid("Google Physical","http://maps.googleapis.com/maps/api/staticmap?sensor=false&maptype=terrain",null,options),new OpenLayers.Layer.Grid("Google Streets","http://maps.googleapis.com/maps/api/staticmap?sensor=false&maptype=roadmap",null,options),new OpenLayers.Layer.Grid("Google Hybrid","http://maps.googleapis.com/maps/api/staticmap?sensor=false&maptype=hybrid",null,options),new OpenLayers.Layer.Grid("Google Satellite","http://maps.googleapis.com/maps/api/staticmap?sensor=false&maptype=satellite",null,options),new OpenLayers.Layer.Grid("Google Satellite (scale=2)","http://maps.googleapis.com/maps/api/staticmap?sensor=false&maptype=satellite&scale=2",null,OpenLayers.Util.applyDefaults({getURL:function(){var e=this.map.getCenter().transform("EPSG:3857","EPSG:4326"),t=this.map.getSize();return[this.url,"&center=",e.lat,",",e.lon,"&zoom=",this.map.getZoom()-1,"&size=",Math.floor(t.w/2),"x",Math.floor(t.h/2)].join("")}},options))],center:(new OpenLayers.LonLat(10.2,48.9)).transform("EPSG:4326","EPSG:3857"),zoom:5});map.addControl(new OpenLayers.Control.LayerSwitcher);