/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Handler.Pinch=OpenLayers.Class(OpenLayers.Handler,{started:!1,stopDown:!1,pinching:!1,last:null,start:null,touchstart:function(e){var t=!0;return this.pinching=!1,OpenLayers.Event.isMultiTouch(e)?(this.started=!0,this.last=this.start={distance:this.getDistance(e.touches),delta:0,scale:1},this.callback("start",[e,this.start]),t=!this.stopDown):(this.started=!1,this.start=null,this.last=null),OpenLayers.Event.stop(e),t},touchmove:function(e){if(this.started&&OpenLayers.Event.isMultiTouch(e)){this.pinching=!0;var t=this.getPinchData(e);this.callback("move",[e,t]),this.last=t,OpenLayers.Event.stop(e)}return!0},touchend:function(e){return this.started&&(this.started=!1,this.pinching=!1,this.callback("done",[e,this.start,this.last]),this.start=null,this.last=null),!0},activate:function(){var e=!1;return OpenLayers.Handler.prototype.activate.apply(this,arguments)&&(this.pinching=!1,e=!0),e},deactivate:function(){var e=!1;return OpenLayers.Handler.prototype.deactivate.apply(this,arguments)&&(this.started=!1,this.pinching=!1,this.start=null,this.last=null,e=!0),e},getDistance:function(e){var t=e[0],n=e[1];return Math.sqrt(Math.pow(t.clientX-n.clientX,2)+Math.pow(t.clientY-n.clientY,2))},getPinchData:function(e){var t=this.getDistance(e.touches),n=t/this.start.distance;return{distance:t,delta:this.last.distance-t,scale:n}},CLASS_NAME:"OpenLayers.Handler.Pinch"});