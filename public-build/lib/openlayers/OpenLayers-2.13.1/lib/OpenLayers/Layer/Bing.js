/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Layer.Bing=OpenLayers.Class(OpenLayers.Layer.XYZ,{key:null,serverResolutions:[156543.03390625,78271.516953125,39135.7584765625,19567.87923828125,9783.939619140625,4891.9698095703125,2445.9849047851562,1222.9924523925781,611.4962261962891,305.74811309814453,152.87405654907226,76.43702827453613,38.218514137268066,19.109257068634033,9.554628534317017,4.777314267158508,2.388657133579254,1.194328566789627,.5971642833948135,.29858214169740677,.14929107084870338,.07464553542435169],attributionTemplate:'<span class="olBingAttribution ${type}"><div><a target="_blank" href="http://www.bing.com/maps/"><img src="${logo}" /></a></div>${copyrights}<a style="white-space: nowrap" target="_blank" href="http://www.microsoft.com/maps/product/terms.html">Terms of Use</a></span>',metadata:null,protocolRegex:/^http:/i,type:"Road",culture:"en-US",metadataParams:null,tileOptions:null,protocol:~window.location.href.indexOf("http")?"":"http:",initialize:function(e){e=OpenLayers.Util.applyDefaults({sphericalMercator:!0},e);var t=e.name||"Bing "+(e.type||this.type),n=[t,null,e];OpenLayers.Layer.XYZ.prototype.initialize.apply(this,n),this.tileOptions=OpenLayers.Util.extend({crossOriginKeyword:"anonymous"},this.options.tileOptions),this.loadMetadata()},loadMetadata:function(){this._callbackId="_callback_"+this.id.replace(/\./g,"_"),window[this._callbackId]=OpenLayers.Function.bind(OpenLayers.Layer.Bing.processMetadata,this);var e=OpenLayers.Util.applyDefaults({key:this.key,jsonp:this._callbackId,include:"ImageryProviders"},this.metadataParams),t=this.protocol+"//dev.virtualearth.net/REST/v1/Imagery/Metadata/"+this.type+"?"+OpenLayers.Util.getParameterString(e),n=document.createElement("script");n.type="text/javascript",n.src=t,n.id=this._callbackId,document.getElementsByTagName("head")[0].appendChild(n)},initLayer:function(){var e=this.metadata.resourceSets[0].resources[0],t=e.imageUrl.replace("{quadkey}","${quadkey}");t=t.replace("{culture}",this.culture),t=t.replace(this.protocolRegex,this.protocol),this.url=[];for(var n=0;n<e.imageUrlSubdomains.length;++n)this.url.push(t.replace("{subdomain}",e.imageUrlSubdomains[n]));this.addOptions({maxResolution:Math.min(this.serverResolutions[e.zoomMin],this.maxResolution||Number.POSITIVE_INFINITY),numZoomLevels:Math.min(e.zoomMax+1-e.zoomMin,this.numZoomLevels)},!0),this.isBaseLayer||this.redraw(),this.updateAttribution()},getURL:function(e){if(!this.url)return;var t=this.getXYZ(e),n=t.x,r=t.y,i=t.z,s=[];for(var o=i;o>0;--o){var u="0",a=1<<o-1;(n&a)!=0&&u++,(r&a)!=0&&(u++,u++),s.push(u)}var f=s.join(""),l=this.selectUrl(""+n+r+i,this.url);return OpenLayers.String.format(l,{quadkey:f})},updateAttribution:function(){var e=this.metadata;if(!e.resourceSets||!this.map||!this.map.center)return;var t=e.resourceSets[0].resources[0],n=this.map.getExtent().transform(this.map.getProjectionObject(),new OpenLayers.Projection("EPSG:4326")),r=t.imageryProviders||[],i=OpenLayers.Util.indexOf(this.serverResolutions,this.getServerResolution()),s="",o,u,a,f,l,c,h;for(u=0,a=r.length;u<a;++u){o=r[u];for(f=0,l=o.coverageAreas.length;f<l;++f)h=o.coverageAreas[f],c=OpenLayers.Bounds.fromArray(h.bbox,!0),n.intersectsBounds(c)&&i<=h.zoomMax&&i>=h.zoomMin&&(s+=o.attribution+" ")}var p=e.brandLogoUri.replace(this.protocolRegex,this.protocol);this.attribution=OpenLayers.String.format(this.attributionTemplate,{type:this.type.toLowerCase(),logo:p,copyrights:s}),this.map&&this.map.events.triggerEvent("changelayer",{layer:this,property:"attribution"})},setMap:function(){OpenLayers.Layer.XYZ.prototype.setMap.apply(this,arguments),this.map.events.register("moveend",this,this.updateAttribution)},clone:function(e){return e==null&&(e=new OpenLayers.Layer.Bing(this.options)),e=OpenLayers.Layer.XYZ.prototype.clone.apply(this,[e]),e},destroy:function(){this.map&&this.map.events.unregister("moveend",this,this.updateAttribution),OpenLayers.Layer.XYZ.prototype.destroy.apply(this,arguments)},CLASS_NAME:"OpenLayers.Layer.Bing"}),OpenLayers.Layer.Bing.processMetadata=function(e){this.metadata=e,this.initLayer();var t=document.getElementById(this._callbackId);t.parentNode.removeChild(t),window[this._callbackId]=undefined,delete this._callbackId};