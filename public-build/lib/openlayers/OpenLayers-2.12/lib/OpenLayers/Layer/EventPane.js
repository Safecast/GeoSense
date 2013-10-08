/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Layer.EventPane=OpenLayers.Class(OpenLayers.Layer,{smoothDragPan:!0,isBaseLayer:!0,isFixed:!0,pane:null,mapObject:null,initialize:function(e,t){OpenLayers.Layer.prototype.initialize.apply(this,arguments),this.pane==null&&(this.pane=OpenLayers.Util.createDiv(this.div.id+"_EventPane"))},destroy:function(){this.mapObject=null,this.pane=null,OpenLayers.Layer.prototype.destroy.apply(this,arguments)},setMap:function(e){OpenLayers.Layer.prototype.setMap.apply(this,arguments),this.pane.style.zIndex=parseInt(this.div.style.zIndex)+1,this.pane.style.display=this.div.style.display,this.pane.style.width="100%",this.pane.style.height="100%",OpenLayers.BROWSER_NAME=="msie"&&(this.pane.style.background="url("+OpenLayers.Util.getImageLocation("blank.gif")+")"),this.isFixed?this.map.viewPortDiv.appendChild(this.pane):this.map.layerContainerDiv.appendChild(this.pane),this.loadMapObject(),this.mapObject==null&&this.loadWarningMessage()},removeMap:function(e){this.pane&&this.pane.parentNode&&this.pane.parentNode.removeChild(this.pane),OpenLayers.Layer.prototype.removeMap.apply(this,arguments)},loadWarningMessage:function(){this.div.style.backgroundColor="darkblue";var e=this.map.getSize(),t=Math.min(e.w,300),n=Math.min(e.h,200),r=new OpenLayers.Size(t,n),i=new OpenLayers.Pixel(e.w/2,e.h/2),s=i.add(-r.w/2,-r.h/2),o=OpenLayers.Util.createDiv(this.name+"_warning",s,r,null,null,null,"auto");o.style.padding="7px",o.style.backgroundColor="yellow",o.innerHTML=this.getWarningHTML(),this.div.appendChild(o)},getWarningHTML:function(){return""},display:function(e){OpenLayers.Layer.prototype.display.apply(this,arguments),this.pane.style.display=this.div.style.display},setZIndex:function(e){OpenLayers.Layer.prototype.setZIndex.apply(this,arguments),this.pane.style.zIndex=parseInt(this.div.style.zIndex)+1},moveByPx:function(e,t){OpenLayers.Layer.prototype.moveByPx.apply(this,arguments),this.dragPanMapObject?this.dragPanMapObject(e,-t):this.moveTo(this.map.getCachedCenter())},moveTo:function(e,t,n){OpenLayers.Layer.prototype.moveTo.apply(this,arguments);if(this.mapObject!=null){var r=this.map.getCenter(),i=this.map.getZoom();if(r!=null){var s=this.getMapObjectCenter(),o=this.getOLLonLatFromMapObjectLonLat(s),u=this.getMapObjectZoom(),a=this.getOLZoomFromMapObjectZoom(u);if(!r.equals(o)||i!=a)if(!t&&o&&this.dragPanMapObject&&this.smoothDragPan){var f=this.map.getViewPortPxFromLonLat(o),l=this.map.getViewPortPxFromLonLat(r);this.dragPanMapObject(l.x-f.x,f.y-l.y)}else{var c=this.getMapObjectLonLatFromOLLonLat(r),h=this.getMapObjectZoomFromOLZoom(i);this.setMapObjectCenter(c,h,n)}}}},getLonLatFromViewPortPx:function(e){var t=null;if(this.mapObject!=null&&this.getMapObjectCenter()!=null){var n=this.getMapObjectPixelFromOLPixel(e),r=this.getMapObjectLonLatFromMapObjectPixel(n);t=this.getOLLonLatFromMapObjectLonLat(r)}return t},getViewPortPxFromLonLat:function(e){var t=null;if(this.mapObject!=null&&this.getMapObjectCenter()!=null){var n=this.getMapObjectLonLatFromOLLonLat(e),r=this.getMapObjectPixelFromMapObjectLonLat(n);t=this.getOLPixelFromMapObjectPixel(r)}return t},getOLLonLatFromMapObjectLonLat:function(e){var t=null;if(e!=null){var n=this.getLongitudeFromMapObjectLonLat(e),r=this.getLatitudeFromMapObjectLonLat(e);t=new OpenLayers.LonLat(n,r)}return t},getMapObjectLonLatFromOLLonLat:function(e){var t=null;return e!=null&&(t=this.getMapObjectLonLatFromLonLat(e.lon,e.lat)),t},getOLPixelFromMapObjectPixel:function(e){var t=null;if(e!=null){var n=this.getXFromMapObjectPixel(e),r=this.getYFromMapObjectPixel(e);t=new OpenLayers.Pixel(n,r)}return t},getMapObjectPixelFromOLPixel:function(e){var t=null;return e!=null&&(t=this.getMapObjectPixelFromXY(e.x,e.y)),t},CLASS_NAME:"OpenLayers.Layer.EventPane"});