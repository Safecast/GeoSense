/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Control.DrawFeature=OpenLayers.Class(OpenLayers.Control,{layer:null,callbacks:null,multi:!1,featureAdded:function(){},initialize:function(e,t,n){OpenLayers.Control.prototype.initialize.apply(this,[n]),this.callbacks=OpenLayers.Util.extend({done:this.drawFeature,modify:function(e,t){this.layer.events.triggerEvent("sketchmodified",{vertex:e,feature:t})},create:function(e,t){this.layer.events.triggerEvent("sketchstarted",{vertex:e,feature:t})}},this.callbacks),this.layer=e,this.handlerOptions=this.handlerOptions||{},this.handlerOptions.layerOptions=OpenLayers.Util.applyDefaults(this.handlerOptions.layerOptions,{renderers:e.renderers,rendererOptions:e.rendererOptions}),"multi"in this.handlerOptions||(this.handlerOptions.multi=this.multi);var r=this.layer.styleMap&&this.layer.styleMap.styles.temporary;r&&(this.handlerOptions.layerOptions=OpenLayers.Util.applyDefaults(this.handlerOptions.layerOptions,{styleMap:new OpenLayers.StyleMap({"default":r})})),this.handler=new t(this,this.callbacks,this.handlerOptions)},drawFeature:function(e){var t=new OpenLayers.Feature.Vector(e),n=this.layer.events.triggerEvent("sketchcomplete",{feature:t});n!==!1&&(t.state=OpenLayers.State.INSERT,this.layer.addFeatures([t]),this.featureAdded(t),this.events.triggerEvent("featureadded",{feature:t}))},insertXY:function(e,t){this.handler&&this.handler.line&&this.handler.insertXY(e,t)},insertDeltaXY:function(e,t){this.handler&&this.handler.line&&this.handler.insertDeltaXY(e,t)},insertDirectionLength:function(e,t){this.handler&&this.handler.line&&this.handler.insertDirectionLength(e,t)},insertDeflectionLength:function(e,t){this.handler&&this.handler.line&&this.handler.insertDeflectionLength(e,t)},undo:function(){return this.handler.undo&&this.handler.undo()},redo:function(){return this.handler.redo&&this.handler.redo()},finishSketch:function(){this.handler.finishGeometry()},cancel:function(){this.handler.cancel()},CLASS_NAME:"OpenLayers.Control.DrawFeature"});