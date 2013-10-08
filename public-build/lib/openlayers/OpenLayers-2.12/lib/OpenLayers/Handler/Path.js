/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Handler.Path=OpenLayers.Class(OpenLayers.Handler.Point,{line:null,maxVertices:null,doubleTouchTolerance:20,freehand:!1,freehandToggle:"shiftKey",timerId:null,redoStack:null,createFeature:function(e){var t=this.layer.getLonLatFromViewPortPx(e),n=new OpenLayers.Geometry.Point(t.lon,t.lat);this.point=new OpenLayers.Feature.Vector(n),this.line=new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString([this.point.geometry])),this.callback("create",[this.point.geometry,this.getSketch()]),this.point.geometry.clearBounds(),this.layer.addFeatures([this.line,this.point],{silent:!0})},destroyFeature:function(e){OpenLayers.Handler.Point.prototype.destroyFeature.call(this,e),this.line=null},destroyPersistedFeature:function(){var e=this.layer;e&&e.features.length>2&&this.layer.features[0].destroy()},removePoint:function(){this.point&&this.layer.removeFeatures([this.point])},addPoint:function(e){this.layer.removeFeatures([this.point]);var t=this.layer.getLonLatFromViewPortPx(e);this.point=new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(t.lon,t.lat)),this.line.geometry.addComponent(this.point.geometry,this.line.geometry.components.length),this.layer.addFeatures([this.point]),this.callback("point",[this.point.geometry,this.getGeometry()]),this.callback("modify",[this.point.geometry,this.getSketch()]),this.drawFeature(),delete this.redoStack},insertXY:function(e,t){this.line.geometry.addComponent(new OpenLayers.Geometry.Point(e,t),this.getCurrentPointIndex()),this.drawFeature(),delete this.redoStack},insertDeltaXY:function(e,t){var n=this.getCurrentPointIndex()-1,r=this.line.geometry.components[n];r&&!isNaN(r.x)&&!isNaN(r.y)&&this.insertXY(r.x+e,r.y+t)},insertDirectionLength:function(e,t){e*=Math.PI/180;var n=t*Math.cos(e),r=t*Math.sin(e);this.insertDeltaXY(n,r)},insertDeflectionLength:function(e,t){var n=this.getCurrentPointIndex()-1;if(n>0){var r=this.line.geometry.components[n],i=this.line.geometry.components[n-1],s=Math.atan2(r.y-i.y,r.x-i.x);this.insertDirectionLength(s*180/Math.PI+e,t)}},getCurrentPointIndex:function(){return this.line.geometry.components.length-1},undo:function(){var e=this.line.geometry,t=e.components,n=this.getCurrentPointIndex()-1,r=t[n],i=e.removeComponent(r);return i&&(this.redoStack||(this.redoStack=[]),this.redoStack.push(r),this.drawFeature()),i},redo:function(){var e=this.redoStack&&this.redoStack.pop();return e&&(this.line.geometry.addComponent(e,this.getCurrentPointIndex()),this.drawFeature()),!!e},freehandMode:function(e){return this.freehandToggle&&e[this.freehandToggle]?!this.freehand:this.freehand},modifyFeature:function(e,t){this.line||this.createFeature(e);var n=this.layer.getLonLatFromViewPortPx(e);this.point.geometry.x=n.lon,this.point.geometry.y=n.lat,this.callback("modify",[this.point.geometry,this.getSketch(),t]),this.point.geometry.clearBounds(),this.drawFeature()},drawFeature:function(){this.layer.drawFeature(this.line,this.style),this.layer.drawFeature(this.point,this.style)},getSketch:function(){return this.line},getGeometry:function(){var e=this.line&&this.line.geometry;return e&&this.multi&&(e=new OpenLayers.Geometry.MultiLineString([e])),e},touchstart:function(e){return this.timerId&&this.passesTolerance(this.lastTouchPx,e.xy,this.doubleTouchTolerance)?(this.finishGeometry(),window.clearTimeout(this.timerId),this.timerId=null,!1):(this.timerId&&(window.clearTimeout(this.timerId),this.timerId=null),this.timerId=window.setTimeout(OpenLayers.Function.bind(function(){this.timerId=null},this),300),OpenLayers.Handler.Point.prototype.touchstart.call(this,e))},down:function(e){var t=this.stopDown;return this.freehandMode(e)&&(t=!0,this.touch&&(this.modifyFeature(e.xy,!!this.lastUp),OpenLayers.Event.stop(e))),!this.touch&&(!this.lastDown||!this.passesTolerance(this.lastDown,e.xy,this.pixelTolerance))&&this.modifyFeature(e.xy,!!this.lastUp),this.mouseDown=!0,this.lastDown=e.xy,this.stoppedDown=t,!t},move:function(e){return this.stoppedDown&&this.freehandMode(e)?(this.persist&&this.destroyPersistedFeature(),this.maxVertices&&this.line&&this.line.geometry.components.length===this.maxVertices?(this.removePoint(),this.finalize()):this.addPoint(e.xy),!1):(!this.touch&&(!this.mouseDown||this.stoppedDown)&&this.modifyFeature(e.xy,!!this.lastUp),!0)},up:function(e){return this.mouseDown&&(!this.lastUp||!this.lastUp.equals(e.xy))&&(this.stoppedDown&&this.freehandMode(e)?(this.persist&&this.destroyPersistedFeature(),this.removePoint(),this.finalize()):this.passesTolerance(this.lastDown,e.xy,this.pixelTolerance)&&(this.touch&&this.modifyFeature(e.xy),this.lastUp==null&&this.persist&&this.destroyPersistedFeature(),this.addPoint(e.xy),this.lastUp=e.xy,this.line.geometry.components.length===this.maxVertices+1&&this.finishGeometry())),this.stoppedDown=this.stopDown,this.mouseDown=!1,!this.stopUp},finishGeometry:function(){var e=this.line.geometry.components.length-1;this.line.geometry.removeComponent(this.line.geometry.components[e]),this.removePoint(),this.finalize()},dblclick:function(e){return this.freehandMode(e)||this.finishGeometry(),!1},CLASS_NAME:"OpenLayers.Handler.Path"});