/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Layer.HTTPRequest=OpenLayers.Class(OpenLayers.Layer,{URL_HASH_FACTOR:(Math.sqrt(5)-1)/2,url:null,params:null,reproject:!1,initialize:function(e,t,n,r){OpenLayers.Layer.prototype.initialize.apply(this,[e,r]),this.url=t,this.params||(this.params=OpenLayers.Util.extend({},n))},destroy:function(){this.url=null,this.params=null,OpenLayers.Layer.prototype.destroy.apply(this,arguments)},clone:function(e){return e==null&&(e=new OpenLayers.Layer.HTTPRequest(this.name,this.url,this.params,this.getOptions())),e=OpenLayers.Layer.prototype.clone.apply(this,[e]),e},setUrl:function(e){this.url=e},mergeNewParams:function(e){this.params=OpenLayers.Util.extend(this.params,e);var t=this.redraw();return this.map!=null&&this.map.events.triggerEvent("changelayer",{layer:this,property:"params"}),t},redraw:function(e){return e?this.mergeNewParams({_olSalt:Math.random()}):OpenLayers.Layer.prototype.redraw.apply(this,[])},selectUrl:function(e,t){var n=1;for(var r=0,i=e.length;r<i;r++)n*=e.charCodeAt(r)*this.URL_HASH_FACTOR,n-=Math.floor(n);return t[Math.floor(n*t.length)]},getFullRequestString:function(e,t){var n=t||this.url,r=OpenLayers.Util.extend({},this.params);r=OpenLayers.Util.extend(r,e);var i=OpenLayers.Util.getParameterString(r);OpenLayers.Util.isArray(n)&&(n=this.selectUrl(i,n));var s=OpenLayers.Util.upperCaseObject(OpenLayers.Util.getParameters(n));for(var o in r)o.toUpperCase()in s&&delete r[o];return i=OpenLayers.Util.getParameterString(r),OpenLayers.Util.urlAppend(n,i)},CLASS_NAME:"OpenLayers.Layer.HTTPRequest"});