/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Pixel=OpenLayers.Class({x:0,y:0,initialize:function(e,t){this.x=parseFloat(e),this.y=parseFloat(t)},toString:function(){return"x="+this.x+",y="+this.y},clone:function(){return new OpenLayers.Pixel(this.x,this.y)},equals:function(e){var t=!1;return e!=null&&(t=this.x==e.x&&this.y==e.y||isNaN(this.x)&&isNaN(this.y)&&isNaN(e.x)&&isNaN(e.y)),t},distanceTo:function(e){return Math.sqrt(Math.pow(this.x-e.x,2)+Math.pow(this.y-e.y,2))},add:function(e,t){if(e==null||t==null)throw new TypeError("Pixel.add cannot receive null values");return new OpenLayers.Pixel(this.x+e,this.y+t)},offset:function(e){var t=this.clone();return e&&(t=this.add(e.x,e.y)),t},CLASS_NAME:"OpenLayers.Pixel"});