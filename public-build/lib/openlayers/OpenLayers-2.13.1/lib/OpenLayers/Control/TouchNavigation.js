/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Control.TouchNavigation=OpenLayers.Class(OpenLayers.Control,{dragPan:null,dragPanOptions:null,pinchZoom:null,pinchZoomOptions:null,clickHandlerOptions:null,documentDrag:!1,autoActivate:!0,initialize:function(e){this.handlers={},OpenLayers.Control.prototype.initialize.apply(this,arguments)},destroy:function(){this.deactivate(),this.dragPan&&this.dragPan.destroy(),this.dragPan=null,this.pinchZoom&&(this.pinchZoom.destroy(),delete this.pinchZoom),OpenLayers.Control.prototype.destroy.apply(this,arguments)},activate:function(){return OpenLayers.Control.prototype.activate.apply(this,arguments)?(this.dragPan.activate(),this.handlers.click.activate(),this.pinchZoom.activate(),!0):!1},deactivate:function(){return OpenLayers.Control.prototype.deactivate.apply(this,arguments)?(this.dragPan.deactivate(),this.handlers.click.deactivate(),this.pinchZoom.deactivate(),!0):!1},draw:function(){var e={click:this.defaultClick,dblclick:this.defaultDblClick},t=OpenLayers.Util.extend({"double":!0,stopDouble:!0,pixelTolerance:2},this.clickHandlerOptions);this.handlers.click=new OpenLayers.Handler.Click(this,e,t),this.dragPan=new OpenLayers.Control.DragPan(OpenLayers.Util.extend({map:this.map,documentDrag:this.documentDrag},this.dragPanOptions)),this.dragPan.draw(),this.pinchZoom=new OpenLayers.Control.PinchZoom(OpenLayers.Util.extend({map:this.map},this.pinchZoomOptions))},defaultClick:function(e){e.lastTouches&&e.lastTouches.length==2&&this.map.zoomOut()},defaultDblClick:function(e){this.map.zoomTo(this.map.zoom+1,e.xy)},CLASS_NAME:"OpenLayers.Control.TouchNavigation"});