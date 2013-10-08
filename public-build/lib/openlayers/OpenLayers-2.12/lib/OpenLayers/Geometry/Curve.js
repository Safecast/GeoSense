/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Geometry.Curve=OpenLayers.Class(OpenLayers.Geometry.MultiPoint,{componentTypes:["OpenLayers.Geometry.Point"],getLength:function(){var e=0;if(this.components&&this.components.length>1)for(var t=1,n=this.components.length;t<n;t++)e+=this.components[t-1].distanceTo(this.components[t]);return e},getGeodesicLength:function(e){var t=this;if(e){var n=new OpenLayers.Projection("EPSG:4326");n.equals(e)||(t=this.clone().transform(e,n))}var r=0;if(t.components&&t.components.length>1){var i,s;for(var o=1,u=t.components.length;o<u;o++)i=t.components[o-1],s=t.components[o],r+=OpenLayers.Util.distVincenty({lon:i.x,lat:i.y},{lon:s.x,lat:s.y})}return r*1e3},CLASS_NAME:"OpenLayers.Geometry.Curve"});