/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Layer.Boxes=OpenLayers.Class(OpenLayers.Layer.Markers,{drawMarker:function(e){var t=this.map.getLayerPxFromLonLat({lon:e.bounds.left,lat:e.bounds.top}),n=this.map.getLayerPxFromLonLat({lon:e.bounds.right,lat:e.bounds.bottom});if(n==null||t==null)e.display(!1);else{var r=e.draw(t,{w:Math.max(1,n.x-t.x),h:Math.max(1,n.y-t.y)});e.drawn||(this.div.appendChild(r),e.drawn=!0)}},removeMarker:function(e){OpenLayers.Util.removeItem(this.markers,e),e.div!=null&&e.div.parentNode==this.div&&this.div.removeChild(e.div)},CLASS_NAME:"OpenLayers.Layer.Boxes"});