/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Tile.UTFGrid=OpenLayers.Class(OpenLayers.Tile,{url:null,utfgridResolution:2,json:null,format:null,destroy:function(){this.clear(),OpenLayers.Tile.prototype.destroy.apply(this,arguments)},draw:function(){var e=OpenLayers.Tile.prototype.draw.apply(this,arguments);if(e){this.isLoading?(this.abortLoading(),this.events.triggerEvent("reload")):(this.isLoading=!0,this.events.triggerEvent("loadstart")),this.url=this.layer.getURL(this.bounds);if(this.layer.useJSONP){var t=new OpenLayers.Protocol.Script({url:this.url,callback:function(e){this.isLoading=!1,this.events.triggerEvent("loadend"),this.json=e.data},scope:this});t.read(),this.request=t}else this.request=OpenLayers.Request.GET({url:this.url,callback:function(e){this.isLoading=!1,this.events.triggerEvent("loadend"),e.status===200&&this.parseData(e.responseText)},scope:this})}else this.unload();return e},abortLoading:function(){this.request&&(this.request.abort(),delete this.request),this.isLoading=!1},getFeatureInfo:function(e,t){var n=null;if(this.json){var r=this.getFeatureId(e,t);r!==null&&(n={id:r,data:this.json.data[r]})}return n},getFeatureId:function(e,t){var n=null;if(this.json){var r=this.utfgridResolution,i=Math.floor(t/r),s=Math.floor(e/r),o=this.json.grid[i].charCodeAt(s),u=this.indexFromCharCode(o),a=this.json.keys;!isNaN(u)&&u in a&&(n=a[u])}return n},indexFromCharCode:function(e){return e>=93&&e--,e>=35&&e--,e-32},parseData:function(e){this.format||(this.format=new OpenLayers.Format.JSON),this.json=this.format.read(e)},clear:function(){this.json=null},CLASS_NAME:"OpenLayers.Tile.UTFGrid"});