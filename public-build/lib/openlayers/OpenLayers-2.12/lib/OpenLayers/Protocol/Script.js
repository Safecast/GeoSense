/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Protocol.Script=OpenLayers.Class(OpenLayers.Protocol,{url:null,params:null,callback:null,callbackTemplate:"OpenLayers.Protocol.Script.registry.${id}",callbackKey:"callback",callbackPrefix:"",scope:null,format:null,pendingRequests:null,srsInBBOX:!1,initialize:function(e){e=e||{},this.params={},this.pendingRequests={},OpenLayers.Protocol.prototype.initialize.apply(this,arguments),this.format||(this.format=new OpenLayers.Format.GeoJSON);if(!this.filterToParams&&OpenLayers.Format.QueryStringFilter){var t=new OpenLayers.Format.QueryStringFilter({srsInBBOX:this.srsInBBOX});this.filterToParams=function(e,n){return t.write(e,n)}}},read:function(e){OpenLayers.Protocol.prototype.read.apply(this,arguments),e=OpenLayers.Util.applyDefaults(e,this.options),e.params=OpenLayers.Util.applyDefaults(e.params,this.options.params),e.filter&&this.filterToParams&&(e.params=this.filterToParams(e.filter,e.params));var t=new OpenLayers.Protocol.Response({requestType:"read"}),n=this.createRequest(e.url,e.params,OpenLayers.Function.bind(function(n){t.data=n,this.handleRead(t,e)},this));return t.priv=n,t},createRequest:function(e,t,n){var r=OpenLayers.Protocol.Script.register(n),i=OpenLayers.String.format(this.callbackTemplate,{id:r});t=OpenLayers.Util.extend({},t),t[this.callbackKey]=this.callbackPrefix+i,e=OpenLayers.Util.urlAppend(e,OpenLayers.Util.getParameterString(t));var s=document.createElement("script");s.type="text/javascript",s.src=e,s.id="OpenLayers_Protocol_Script_"+r,this.pendingRequests[s.id]=s;var o=document.getElementsByTagName("head")[0];return o.appendChild(s),s},destroyRequest:function(e){OpenLayers.Protocol.Script.unregister(e.id.split("_").pop()),delete this.pendingRequests[e.id],e.parentNode&&e.parentNode.removeChild(e)},handleRead:function(e,t){this.handleResponse(e,t)},handleResponse:function(e,t){t.callback&&(e.data?(e.features=this.parseFeatures(e.data),e.code=OpenLayers.Protocol.Response.SUCCESS):e.code=OpenLayers.Protocol.Response.FAILURE,this.destroyRequest(e.priv),t.callback.call(t.scope,e))},parseFeatures:function(e){return this.format.read(e)},abort:function(e){if(e)this.destroyRequest(e.priv);else for(var t in this.pendingRequests)this.destroyRequest(this.pendingRequests[t])},destroy:function(){this.abort(),delete this.params,delete this.format,OpenLayers.Protocol.prototype.destroy.apply(this)},CLASS_NAME:"OpenLayers.Protocol.Script"}),function(){var e=OpenLayers.Protocol.Script,t=0;e.registry={},e.register=function(n){var r="c"+ ++t;return e.registry[r]=function(){n.apply(this,arguments)},r},e.unregister=function(t){delete e.registry[t]}}();