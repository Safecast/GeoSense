/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Control.WMSGetFeatureInfo=OpenLayers.Class(OpenLayers.Control,{hover:!1,drillDown:!1,maxFeatures:10,clickCallback:"click",output:"features",layers:null,queryVisible:!1,url:null,layerUrls:null,infoFormat:"text/html",vendorParams:{},format:null,formatOptions:null,handler:null,hoverRequest:null,initialize:function(e){e=e||{},e.handlerOptions=e.handlerOptions||{},OpenLayers.Control.prototype.initialize.apply(this,[e]),this.format||(this.format=new OpenLayers.Format.WMSGetFeatureInfo(e.formatOptions)),this.drillDown===!0&&(this.hover=!1);if(this.hover)this.handler=new OpenLayers.Handler.Hover(this,{move:this.cancelHover,pause:this.getInfoForHover},OpenLayers.Util.extend(this.handlerOptions.hover||{},{delay:250}));else{var t={};t[this.clickCallback]=this.getInfoForClick,this.handler=new OpenLayers.Handler.Click(this,t,this.handlerOptions.click||{})}},getInfoForClick:function(e){this.events.triggerEvent("beforegetfeatureinfo",{xy:e.xy}),OpenLayers.Element.addClass(this.map.viewPortDiv,"olCursorWait"),this.request(e.xy,{})},getInfoForHover:function(e){this.events.triggerEvent("beforegetfeatureinfo",{xy:e.xy}),this.request(e.xy,{hover:!0})},cancelHover:function(){this.hoverRequest&&(this.hoverRequest.abort(),this.hoverRequest=null)},findLayers:function(){var e=this.layers||this.map.layers,t=[],n,r;for(var i=e.length-1;i>=0;--i)n=e[i],n instanceof OpenLayers.Layer.WMS&&(!this.queryVisible||n.getVisibility())&&(r=OpenLayers.Util.isArray(n.url)?n.url[0]:n.url,this.drillDown===!1&&!this.url&&(this.url=r),(this.drillDown===!0||this.urlMatches(r))&&t.push(n));return t},urlMatches:function(e){var t=OpenLayers.Util.isEquivalentUrl(this.url,e);if(!t&&this.layerUrls)for(var n=0,r=this.layerUrls.length;n<r;++n)if(OpenLayers.Util.isEquivalentUrl(this.layerUrls[n],e)){t=!0;break}return t},buildWMSOptions:function(e,t,n,r){var i=[],s=[];for(var o=0,u=t.length;o<u;o++)t[o].params.LAYERS!=null&&(i=i.concat(t[o].params.LAYERS),s=s.concat(this.getStyleNames(t[o])));var a=t[0],f=this.map.getProjection(),l=a.projection;l&&l.equals(this.map.getProjectionObject())&&(f=l.getCode());var c=OpenLayers.Util.extend({service:"WMS",version:a.params.VERSION,request:"GetFeatureInfo",exceptions:a.params.EXCEPTIONS,bbox:this.map.getExtent().toBBOX(null,a.reverseAxisOrder()),feature_count:this.maxFeatures,height:this.map.getSize().h,width:this.map.getSize().w,format:r,info_format:a.params.INFO_FORMAT||this.infoFormat},parseFloat(a.params.VERSION)>=1.3?{crs:f,i:parseInt(n.x),j:parseInt(n.y)}:{srs:f,x:parseInt(n.x),y:parseInt(n.y)});return i.length!=0&&(c=OpenLayers.Util.extend({layers:i,query_layers:i,styles:s},c)),OpenLayers.Util.applyDefaults(c,this.vendorParams),{url:e,params:OpenLayers.Util.upperCaseObject(c),callback:function(t){this.handleResponse(n,t,e)},scope:this}},getStyleNames:function(e){var t;return e.params.STYLES?t=e.params.STYLES:OpenLayers.Util.isArray(e.params.LAYERS)?t=new Array(e.params.LAYERS.length):t=e.params.LAYERS.replace(/[^,]/g,""),t},request:function(e,t){var n=this.findLayers();if(n.length==0){this.events.triggerEvent("nogetfeatureinfo"),OpenLayers.Element.removeClass(this.map.viewPortDiv,"olCursorWait");return}t=t||{};if(this.drillDown===!1){var r=this.buildWMSOptions(this.url,n,e,n[0].params.FORMAT),i=OpenLayers.Request.GET(r);t.hover===!0&&(this.hoverRequest=i)}else{this._requestCount=0,this._numRequests=0,this.features=[];var s={},o;for(var u=0,a=n.length;u<a;u++){var f=n[u],l,c=!1;o=OpenLayers.Util.isArray(f.url)?f.url[0]:f.url,o in s?s[o].push(f):(this._numRequests++,s[o]=[f])}var n;for(var o in s){n=s[o];var r=this.buildWMSOptions(o,n,e,n[0].params.FORMAT);OpenLayers.Request.GET(r)}}},triggerGetFeatureInfo:function(e,t,n){this.events.triggerEvent("getfeatureinfo",{text:e.responseText,features:n,request:e,xy:t}),OpenLayers.Element.removeClass(this.map.viewPortDiv,"olCursorWait")},handleResponse:function(e,t,n){var r=t.responseXML;if(!r||!r.documentElement)r=t.responseText;var i=this.format.read(r);this.drillDown===!1?this.triggerGetFeatureInfo(t,e,i):(this._requestCount++,this.output==="object"?this._features=(this._features||[]).concat({url:n,features:i}):this._features=(this._features||[]).concat(i),this._requestCount===this._numRequests&&(this.triggerGetFeatureInfo(t,e,this._features.concat()),delete this._features,delete this._requestCount,delete this._numRequests))},CLASS_NAME:"OpenLayers.Control.WMSGetFeatureInfo"});