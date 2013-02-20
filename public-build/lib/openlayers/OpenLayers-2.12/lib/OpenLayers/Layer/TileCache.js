/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Layer.TileCache=OpenLayers.Class(OpenLayers.Layer.Grid,{isBaseLayer:!0,format:"image/png",serverResolutions:null,initialize:function(e,t,n,r){this.layername=n,OpenLayers.Layer.Grid.prototype.initialize.apply(this,[e,t,{},r]),this.extension=this.format.split("/")[1].toLowerCase(),this.extension=this.extension=="jpg"?"jpeg":this.extension},clone:function(e){return e==null&&(e=new OpenLayers.Layer.TileCache(this.name,this.url,this.layername,this.getOptions())),e=OpenLayers.Layer.Grid.prototype.clone.apply(this,[e]),e},getURL:function(e){function u(e,t){e=String(e);var n=[];for(var r=0;r<t;++r)n.push("0");return n.join("").substring(0,t-e.length)+e}var t=this.getServerResolution(),n=this.maxExtent,r=this.tileSize,i=Math.round((e.left-n.left)/(t*r.w)),s=Math.round((e.bottom-n.bottom)/(t*r.h)),o=this.serverResolutions!=null?OpenLayers.Util.indexOf(this.serverResolutions,t):this.map.getZoom(),a=[this.layername,u(o,2),u(parseInt(i/1e6),3),u(parseInt(i/1e3)%1e3,3),u(parseInt(i)%1e3,3),u(parseInt(s/1e6),3),u(parseInt(s/1e3)%1e3,3),u(parseInt(s)%1e3,3)+"."+this.extension],f=a.join("/"),l=this.url;return OpenLayers.Util.isArray(l)&&(l=this.selectUrl(f,l)),l=l.charAt(l.length-1)=="/"?l:l+"/",l+f},CLASS_NAME:"OpenLayers.Layer.TileCache"});