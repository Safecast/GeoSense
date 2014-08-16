/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Protocol.HTTP=OpenLayers.Class(OpenLayers.Protocol,{url:null,headers:null,params:null,callback:null,scope:null,readWithPOST:!1,updateWithPOST:!1,deleteWithPOST:!1,wildcarded:!1,srsInBBOX:!1,initialize:function(e){e=e||{},this.params={},this.headers={},OpenLayers.Protocol.prototype.initialize.apply(this,arguments);if(!this.filterToParams&&OpenLayers.Format.QueryStringFilter){var t=new OpenLayers.Format.QueryStringFilter({wildcarded:this.wildcarded,srsInBBOX:this.srsInBBOX});this.filterToParams=function(e,n){return t.write(e,n)}}},destroy:function(){this.params=null,this.headers=null,OpenLayers.Protocol.prototype.destroy.apply(this)},read:function(e){OpenLayers.Protocol.prototype.read.apply(this,arguments),e=e||{},e.params=OpenLayers.Util.applyDefaults(e.params,this.options.params),e=OpenLayers.Util.applyDefaults(e,this.options),e.filter&&this.filterToParams&&(e.params=this.filterToParams(e.filter,e.params));var t=e.readWithPOST!==undefined?e.readWithPOST:this.readWithPOST,n=new OpenLayers.Protocol.Response({requestType:"read"});if(t){var r=e.headers||{};r["Content-Type"]="application/x-www-form-urlencoded",n.priv=OpenLayers.Request.POST({url:e.url,callback:this.createCallback(this.handleRead,n,e),data:OpenLayers.Util.getParameterString(e.params),headers:r})}else n.priv=OpenLayers.Request.GET({url:e.url,callback:this.createCallback(this.handleRead,n,e),params:e.params,headers:e.headers});return n},handleRead:function(e,t){this.handleResponse(e,t)},create:function(e,t){t=OpenLayers.Util.applyDefaults(t,this.options);var n=new OpenLayers.Protocol.Response({reqFeatures:e,requestType:"create"});return n.priv=OpenLayers.Request.POST({url:t.url,callback:this.createCallback(this.handleCreate,n,t),headers:t.headers,data:this.format.write(e)}),n},handleCreate:function(e,t){this.handleResponse(e,t)},update:function(e,t){t=t||{};var n=t.url||e.url||this.options.url+"/"+e.fid;t=OpenLayers.Util.applyDefaults(t,this.options);var r=new OpenLayers.Protocol.Response({reqFeatures:e,requestType:"update"}),i=this.updateWithPOST?"POST":"PUT";return r.priv=OpenLayers.Request[i]({url:n,callback:this.createCallback(this.handleUpdate,r,t),headers:t.headers,data:this.format.write(e)}),r},handleUpdate:function(e,t){this.handleResponse(e,t)},"delete":function(e,t){t=t||{};var n=t.url||e.url||this.options.url+"/"+e.fid;t=OpenLayers.Util.applyDefaults(t,this.options);var r=new OpenLayers.Protocol.Response({reqFeatures:e,requestType:"delete"}),i=this.deleteWithPOST?"POST":"DELETE",s={url:n,callback:this.createCallback(this.handleDelete,r,t),headers:t.headers};return this.deleteWithPOST&&(s.data=this.format.write(e)),r.priv=OpenLayers.Request[i](s),r},handleDelete:function(e,t){this.handleResponse(e,t)},handleResponse:function(e,t){var n=e.priv;t.callback&&(n.status>=200&&n.status<300?(e.requestType!="delete"&&(e.features=this.parseFeatures(n)),e.code=OpenLayers.Protocol.Response.SUCCESS):e.code=OpenLayers.Protocol.Response.FAILURE,t.callback.call(t.scope,e))},parseFeatures:function(e){var t=e.responseXML;if(!t||!t.documentElement)t=e.responseText;return!t||t.length<=0?null:this.format.read(t)},commit:function(e,t){function p(e){var t=e.features?e.features.length:0,n=new Array(t);for(var r=0;r<t;++r)n[r]=e.features[r].fid;h.insertIds=n,d.apply(this,[e])}function d(e){this.callUserCallback(e,t),c=c&&e.success(),r++,r>=l&&t.callback&&(h.code=c?OpenLayers.Protocol.Response.SUCCESS:OpenLayers.Protocol.Response.FAILURE,t.callback.apply(t.scope,[h]))}t=OpenLayers.Util.applyDefaults(t,this.options);var n=[],r=0,i={};i[OpenLayers.State.INSERT]=[],i[OpenLayers.State.UPDATE]=[],i[OpenLayers.State.DELETE]=[];var s,o,u=[];for(var a=0,f=e.length;a<f;++a)s=e[a],o=i[s.state],o&&(o.push(s),u.push(s));var l=(i[OpenLayers.State.INSERT].length>0?1:0)+i[OpenLayers.State.UPDATE].length+i[OpenLayers.State.DELETE].length,c=!0,h=new OpenLayers.Protocol.Response({reqFeatures:u}),v=i[OpenLayers.State.INSERT];v.length>0&&n.push(this.create(v,OpenLayers.Util.applyDefaults({callback:p,scope:this},t.create))),v=i[OpenLayers.State.UPDATE];for(var a=v.length-1;a>=0;--a)n.push(this.update(v[a],OpenLayers.Util.applyDefaults({callback:d,scope:this},t.update)));v=i[OpenLayers.State.DELETE];for(var a=v.length-1;a>=0;--a)n.push(this["delete"](v[a],OpenLayers.Util.applyDefaults({callback:d,scope:this},t["delete"])));return n},abort:function(e){e&&e.priv.abort()},callUserCallback:function(e,t){var n=t[e.requestType];n&&n.callback&&n.callback.call(n.scope,e)},CLASS_NAME:"OpenLayers.Protocol.HTTP"});