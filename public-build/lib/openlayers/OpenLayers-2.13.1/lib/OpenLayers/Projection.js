/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Projection=OpenLayers.Class({proj:null,projCode:null,titleRegEx:/\+title=[^\+]*/,initialize:function(e,t){OpenLayers.Util.extend(this,t),this.projCode=e,typeof Proj4js=="object"&&(this.proj=new Proj4js.Proj(e))},getCode:function(){return this.proj?this.proj.srsCode:this.projCode},getUnits:function(){return this.proj?this.proj.units:null},toString:function(){return this.getCode()},equals:function(e){var t=e,n=!1;if(t){t instanceof OpenLayers.Projection||(t=new OpenLayers.Projection(t));if(typeof Proj4js=="object"&&this.proj.defData&&t.proj.defData)n=this.proj.defData.replace(this.titleRegEx,"")==t.proj.defData.replace(this.titleRegEx,"");else if(t.getCode){var r=this.getCode(),i=t.getCode();n=r==i||!!OpenLayers.Projection.transforms[r]&&OpenLayers.Projection.transforms[r][i]===OpenLayers.Projection.nullTransform}}return n},destroy:function(){delete this.proj,delete this.projCode},CLASS_NAME:"OpenLayers.Projection"}),OpenLayers.Projection.transforms={},OpenLayers.Projection.defaults={"EPSG:4326":{units:"degrees",maxExtent:[-180,-90,180,90],yx:!0},"CRS:84":{units:"degrees",maxExtent:[-180,-90,180,90]},"EPSG:900913":{units:"m",maxExtent:[-20037508.34,-20037508.34,20037508.34,20037508.34]}},OpenLayers.Projection.addTransform=function(e,t,n){if(n===OpenLayers.Projection.nullTransform){var r=OpenLayers.Projection.defaults[e];r&&!OpenLayers.Projection.defaults[t]&&(OpenLayers.Projection.defaults[t]=r)}OpenLayers.Projection.transforms[e]||(OpenLayers.Projection.transforms[e]={}),OpenLayers.Projection.transforms[e][t]=n},OpenLayers.Projection.transform=function(e,t,n){if(t&&n){t instanceof OpenLayers.Projection||(t=new OpenLayers.Projection(t)),n instanceof OpenLayers.Projection||(n=new OpenLayers.Projection(n));if(t.proj&&n.proj)e=Proj4js.transform(t.proj,n.proj,e);else{var r=t.getCode(),i=n.getCode(),s=OpenLayers.Projection.transforms;s[r]&&s[r][i]&&s[r][i](e)}}return e},OpenLayers.Projection.nullTransform=function(e){return e},function(){function t(t){return t.x=180*t.x/e,t.y=180/Math.PI*(2*Math.atan(Math.exp(t.y/e*Math.PI))-Math.PI/2),t}function n(t){t.x=t.x*e/180;var n=Math.log(Math.tan((90+t.y)*Math.PI/360))/Math.PI*e;return t.y=Math.max(-20037508.34,Math.min(n,20037508.34)),t}function r(e,r){var i=OpenLayers.Projection.addTransform,s=OpenLayers.Projection.nullTransform,o,u,a,f,l;for(o=0,u=r.length;o<u;++o){a=r[o],i(e,a,n),i(a,e,t);for(l=o+1;l<u;++l)f=r[l],i(a,f,s),i(f,a,s)}}var e=20037508.34,i=["EPSG:900913","EPSG:3857","EPSG:102113","EPSG:102100"],s=["CRS:84","urn:ogc:def:crs:EPSG:6.6:4326","EPSG:4326"],o;for(o=i.length-1;o>=0;--o)r(i[o],s);for(o=s.length-1;o>=0;--o)r(s[o],i)}();