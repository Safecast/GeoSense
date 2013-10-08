/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Handler.Hover=OpenLayers.Class(OpenLayers.Handler,{delay:500,pixelTolerance:null,stopMove:!1,px:null,timerId:null,mousemove:function(e){return this.passesTolerance(e.xy)&&(this.clearTimer(),this.callback("move",[e]),this.px=e.xy,e=OpenLayers.Util.extend({},e),this.timerId=window.setTimeout(OpenLayers.Function.bind(this.delayedCall,this,e),this.delay)),!this.stopMove},mouseout:function(e){return OpenLayers.Util.mouseLeft(e,this.map.viewPortDiv)&&(this.clearTimer(),this.callback("move",[e])),!0},passesTolerance:function(e){var t=!0;if(this.pixelTolerance&&this.px){var n=Math.sqrt(Math.pow(this.px.x-e.x,2)+Math.pow(this.px.y-e.y,2));n<this.pixelTolerance&&(t=!1)}return t},clearTimer:function(){this.timerId!=null&&(window.clearTimeout(this.timerId),this.timerId=null)},delayedCall:function(e){this.callback("pause",[e])},deactivate:function(){var e=!1;return OpenLayers.Handler.prototype.deactivate.apply(this,arguments)&&(this.clearTimer(),e=!0),e},CLASS_NAME:"OpenLayers.Handler.Hover"});