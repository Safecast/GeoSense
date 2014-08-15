/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Handler.Point=OpenLayers.Class(OpenLayers.Handler,{point:null,layer:null,multi:!1,citeCompliant:!1,mouseDown:!1,stoppedDown:null,lastDown:null,lastUp:null,persist:!1,stopDown:!1,stopUp:!1,layerOptions:null,pixelTolerance:5,lastTouchPx:null,initialize:function(e,t,n){n&&n.layerOptions&&n.layerOptions.styleMap||(this.style=OpenLayers.Util.extend(OpenLayers.Feature.Vector.style["default"],{})),OpenLayers.Handler.prototype.initialize.apply(this,arguments)},activate:function(){if(!OpenLayers.Handler.prototype.activate.apply(this,arguments))return!1;var e=OpenLayers.Util.extend({displayInLayerSwitcher:!1,calculateInRange:OpenLayers.Function.True,wrapDateLine:this.citeCompliant},this.layerOptions);return this.layer=new OpenLayers.Layer.Vector(this.CLASS_NAME,e),this.map.addLayer(this.layer),!0},createFeature:function(e){var t=this.layer.getLonLatFromViewPortPx(e),n=new OpenLayers.Geometry.Point(t.lon,t.lat);this.point=new OpenLayers.Feature.Vector(n),this.callback("create",[this.point.geometry,this.point]),this.point.geometry.clearBounds(),this.layer.addFeatures([this.point],{silent:!0})},deactivate:function(){return OpenLayers.Handler.prototype.deactivate.apply(this,arguments)?(this.cancel(),this.layer.map!=null&&(this.destroyFeature(!0),this.layer.destroy(!1)),this.layer=null,!0):!1},destroyFeature:function(e){this.layer&&(e||!this.persist)&&this.layer.destroyFeatures(),this.point=null},destroyPersistedFeature:function(){var e=this.layer;e&&e.features.length>1&&this.layer.features[0].destroy()},finalize:function(e){var t=e?"cancel":"done";this.mouseDown=!1,this.lastDown=null,this.lastUp=null,this.lastTouchPx=null,this.callback(t,[this.geometryClone()]),this.destroyFeature(e)},cancel:function(){this.finalize(!0)},click:function(e){return OpenLayers.Event.stop(e),!1},dblclick:function(e){return OpenLayers.Event.stop(e),!1},modifyFeature:function(e){this.point||this.createFeature(e);var t=this.layer.getLonLatFromViewPortPx(e);this.point.geometry.x=t.lon,this.point.geometry.y=t.lat,this.callback("modify",[this.point.geometry,this.point,!1]),this.point.geometry.clearBounds(),this.drawFeature()},drawFeature:function(){this.layer.drawFeature(this.point,this.style)},getGeometry:function(){var e=this.point&&this.point.geometry;return e&&this.multi&&(e=new OpenLayers.Geometry.MultiPoint([e])),e},geometryClone:function(){var e=this.getGeometry();return e&&e.clone()},mousedown:function(e){return this.down(e)},touchstart:function(e){return this.startTouch(),this.lastTouchPx=e.xy,this.down(e)},mousemove:function(e){return this.move(e)},touchmove:function(e){return this.lastTouchPx=e.xy,this.move(e)},mouseup:function(e){return this.up(e)},touchend:function(e){return e.xy=this.lastTouchPx,this.up(e)},down:function(e){return this.mouseDown=!0,this.lastDown=e.xy,this.touch||this.modifyFeature(e.xy),this.stoppedDown=this.stopDown,!this.stopDown},move:function(e){return!this.touch&&(!this.mouseDown||this.stoppedDown)&&this.modifyFeature(e.xy),!0},up:function(e){return this.mouseDown=!1,this.stoppedDown=this.stopDown,this.checkModifiers(e)?this.lastUp&&this.lastUp.equals(e.xy)?!0:this.lastDown&&this.passesTolerance(this.lastDown,e.xy,this.pixelTolerance)?(this.touch&&this.modifyFeature(e.xy),this.persist&&this.destroyPersistedFeature(),this.lastUp=e.xy,this.finalize(),!this.stopUp):!0:!0},mouseout:function(e){OpenLayers.Util.mouseLeft(e,this.map.viewPortDiv)&&(this.stoppedDown=this.stopDown,this.mouseDown=!1)},passesTolerance:function(e,t,n){var r=!0;if(n!=null&&e&&t){var i=e.distanceTo(t);i>n&&(r=!1)}return r},CLASS_NAME:"OpenLayers.Handler.Point"});