/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Layer.ArcGIS93Rest=OpenLayers.Class(OpenLayers.Layer.Grid,{DEFAULT_PARAMS:{format:"png"},isBaseLayer:!0,initialize:function(e,t,n,r){var i=[];n=OpenLayers.Util.upperCaseObject(n),i.push(e,t,n,r),OpenLayers.Layer.Grid.prototype.initialize.apply(this,i),OpenLayers.Util.applyDefaults(this.params,OpenLayers.Util.upperCaseObject(this.DEFAULT_PARAMS));if(this.params.TRANSPARENT&&this.params.TRANSPARENT.toString().toLowerCase()=="true"){if(r==null||!r.isBaseLayer)this.isBaseLayer=!1;this.params.FORMAT=="jpg"&&(this.params.FORMAT=OpenLayers.Util.alphaHack()?"gif":"png")}},clone:function(e){return e==null&&(e=new OpenLayers.Layer.ArcGIS93Rest(this.name,this.url,this.params,this.getOptions())),e=OpenLayers.Layer.Grid.prototype.clone.apply(this,[e]),e},getURL:function(e){e=this.adjustBounds(e);var t=this.projection.getCode().split(":"),n=t[t.length-1],r=this.getImageSize(),i={BBOX:e.toBBOX(),SIZE:r.w+","+r.h,F:"image",BBOXSR:n,IMAGESR:n};if(this.layerDefs){var s=[],o;for(o in this.layerDefs)this.layerDefs.hasOwnProperty(o)&&this.layerDefs[o]&&(s.push(o),s.push(":"),s.push(this.layerDefs[o]),s.push(";"));s.length>0&&(i.LAYERDEFS=s.join(""))}var u=this.getFullRequestString(i);return u},setLayerFilter:function(e,t){this.layerDefs||(this.layerDefs={}),t?this.layerDefs[e]=t:delete this.layerDefs[e]},clearLayerFilter:function(e){e?delete this.layerDefs[e]:delete this.layerDefs},mergeNewParams:function(e){var t=OpenLayers.Util.upperCaseObject(e),n=[t];return OpenLayers.Layer.Grid.prototype.mergeNewParams.apply(this,n)},CLASS_NAME:"OpenLayers.Layer.ArcGIS93Rest"});