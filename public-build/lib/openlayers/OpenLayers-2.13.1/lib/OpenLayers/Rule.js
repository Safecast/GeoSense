/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Rule=OpenLayers.Class({id:null,name:null,title:null,description:null,context:null,filter:null,elseFilter:!1,symbolizer:null,symbolizers:null,minScaleDenominator:null,maxScaleDenominator:null,initialize:function(e){this.symbolizer={},OpenLayers.Util.extend(this,e),this.symbolizers&&delete this.symbolizer,this.id=OpenLayers.Util.createUniqueID(this.CLASS_NAME+"_")},destroy:function(){for(var e in this.symbolizer)this.symbolizer[e]=null;this.symbolizer=null,delete this.symbolizers},evaluate:function(e){var t=this.getContext(e),n=!0;if(this.minScaleDenominator||this.maxScaleDenominator)var r=e.layer.map.getScale();return this.minScaleDenominator&&(n=r>=OpenLayers.Style.createLiteral(this.minScaleDenominator,t)),n&&this.maxScaleDenominator&&(n=r<OpenLayers.Style.createLiteral(this.maxScaleDenominator,t)),n&&this.filter&&(this.filter.CLASS_NAME=="OpenLayers.Filter.FeatureId"?n=this.filter.evaluate(e):n=this.filter.evaluate(t)),n},getContext:function(e){var t=this.context;return t||(t=e.attributes||e.data),typeof this.context=="function"&&(t=this.context(e)),t},clone:function(){var e=OpenLayers.Util.extend({},this);if(this.symbolizers){var t=this.symbolizers.length;e.symbolizers=new Array(t);for(var n=0;n<t;++n)e.symbolizers[n]=this.symbolizers[n].clone()}else{e.symbolizer={};var r,i;for(var s in this.symbolizer)r=this.symbolizer[s],i=typeof r,i==="object"?e.symbolizer[s]=OpenLayers.Util.extend({},r):i==="string"&&(e.symbolizer[s]=r)}return e.filter=this.filter&&this.filter.clone(),e.context=this.context&&OpenLayers.Util.extend({},this.context),new OpenLayers.Rule(e)},CLASS_NAME:"OpenLayers.Rule"});