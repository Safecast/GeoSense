/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.LonLat=OpenLayers.Class({lon:0,lat:0,initialize:function(e,t){OpenLayers.Util.isArray(e)&&(t=e[1],e=e[0]),this.lon=OpenLayers.Util.toFloat(e),this.lat=OpenLayers.Util.toFloat(t)},toString:function(){return"lon="+this.lon+",lat="+this.lat},toShortString:function(){return this.lon+", "+this.lat},clone:function(){return new OpenLayers.LonLat(this.lon,this.lat)},add:function(e,t){if(e==null||t==null)throw new TypeError("LonLat.add cannot receive null values");return new OpenLayers.LonLat(this.lon+OpenLayers.Util.toFloat(e),this.lat+OpenLayers.Util.toFloat(t))},equals:function(e){var t=!1;return e!=null&&(t=this.lon==e.lon&&this.lat==e.lat||isNaN(this.lon)&&isNaN(this.lat)&&isNaN(e.lon)&&isNaN(e.lat)),t},transform:function(e,t){var n=OpenLayers.Projection.transform({x:this.lon,y:this.lat},e,t);return this.lon=n.x,this.lat=n.y,this},wrapDateLine:function(e){var t=this.clone();if(e){while(t.lon<e.left)t.lon+=e.getWidth();while(t.lon>e.right)t.lon-=e.getWidth()}return t},CLASS_NAME:"OpenLayers.LonLat"}),OpenLayers.LonLat.fromString=function(e){var t=e.split(",");return new OpenLayers.LonLat(t[0],t[1])},OpenLayers.LonLat.fromArray=function(e){var t=OpenLayers.Util.isArray(e),n=t&&e[0],r=t&&e[1];return new OpenLayers.LonLat(n,r)};