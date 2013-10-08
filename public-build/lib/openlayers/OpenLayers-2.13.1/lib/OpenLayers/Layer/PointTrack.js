/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Layer.PointTrack=OpenLayers.Class(OpenLayers.Layer.Vector,{dataFrom:null,styleFrom:null,addNodes:function(e,t){if(e.length<2)throw new Error("At least two point features have to be added to create a line from");var n=new Array(e.length-1),r,i,s;for(var o=0,u=e.length;o<u;o++){r=e[o],s=r.geometry;if(!s){var a=r.lonlat;s=new OpenLayers.Geometry.Point(a.lon,a.lat)}else if(s.CLASS_NAME!="OpenLayers.Geometry.Point")throw new TypeError("Only features with point geometries are supported.");if(o>0){var f=this.dataFrom!=null?e[o+this.dataFrom].data||e[o+this.dataFrom].attributes:null,l=this.styleFrom!=null?e[o+this.styleFrom].style:null,c=new OpenLayers.Geometry.LineString([i,s]);n[o-1]=new OpenLayers.Feature.Vector(c,f,l)}i=s}this.addFeatures(n,t)},CLASS_NAME:"OpenLayers.Layer.PointTrack"}),OpenLayers.Layer.PointTrack.SOURCE_NODE=-1,OpenLayers.Layer.PointTrack.TARGET_NODE=0,OpenLayers.Layer.PointTrack.dataFrom={SOURCE_NODE:-1,TARGET_NODE:0};