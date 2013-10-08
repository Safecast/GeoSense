/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Strategy.Paging=OpenLayers.Class(OpenLayers.Strategy,{features:null,length:10,num:null,paging:!1,activate:function(){var e=OpenLayers.Strategy.prototype.activate.call(this);return e&&this.layer.events.on({beforefeaturesadded:this.cacheFeatures,scope:this}),e},deactivate:function(){var e=OpenLayers.Strategy.prototype.deactivate.call(this);return e&&(this.clearCache(),this.layer.events.un({beforefeaturesadded:this.cacheFeatures,scope:this})),e},cacheFeatures:function(e){this.paging||(this.clearCache(),this.features=e.features,this.pageNext(e))},clearCache:function(){if(this.features)for(var e=0;e<this.features.length;++e)this.features[e].destroy();this.features=null,this.num=null},pageCount:function(){var e=this.features?this.features.length:0;return Math.ceil(e/this.length)},pageNum:function(){return this.num},pageLength:function(e){return e&&e>0&&(this.length=e),this.length},pageNext:function(e){var t=!1;if(this.features){this.num===null&&(this.num=-1);var n=(this.num+1)*this.length;t=this.page(n,e)}return t},pagePrevious:function(){var e=!1;if(this.features){this.num===null&&(this.num=this.pageCount());var t=(this.num-1)*this.length;e=this.page(t)}return e},page:function(e,t){var n=!1;if(this.features&&e>=0&&e<this.features.length){var r=Math.floor(e/this.length);if(r!=this.num){this.paging=!0;var i=this.features.slice(e,e+this.length);this.layer.removeFeatures(this.layer.features),this.num=r,t&&t.features?t.features=i:this.layer.addFeatures(i),this.paging=!1,n=!0}}return n},CLASS_NAME:"OpenLayers.Strategy.Paging"});