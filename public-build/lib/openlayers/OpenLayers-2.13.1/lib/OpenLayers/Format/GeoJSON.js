/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Format.GeoJSON=OpenLayers.Class(OpenLayers.Format.JSON,{ignoreExtraDims:!1,read:function(e,t,n){t=t?t:"FeatureCollection";var r=null,i=null;typeof e=="string"?i=OpenLayers.Format.JSON.prototype.read.apply(this,[e,n]):i=e;if(!i)OpenLayers.Console.error("Bad JSON: "+e);else if(typeof i.type!="string")OpenLayers.Console.error("Bad GeoJSON - no type: "+e);else if(this.isValidType(i,t))switch(t){case"Geometry":try{r=this.parseGeometry(i)}catch(s){OpenLayers.Console.error(s)}break;case"Feature":try{r=this.parseFeature(i),r.type="Feature"}catch(s){OpenLayers.Console.error(s)}break;case"FeatureCollection":r=[];switch(i.type){case"Feature":try{r.push(this.parseFeature(i))}catch(s){r=null,OpenLayers.Console.error(s)}break;case"FeatureCollection":for(var o=0,u=i.features.length;o<u;++o)try{r.push(this.parseFeature(i.features[o]))}catch(s){r=null,OpenLayers.Console.error(s)}break;default:try{var a=this.parseGeometry(i);r.push(new OpenLayers.Feature.Vector(a))}catch(s){r=null,OpenLayers.Console.error(s)}}}return r},isValidType:function(e,t){var n=!1;switch(t){case"Geometry":OpenLayers.Util.indexOf(["Point","MultiPoint","LineString","MultiLineString","Polygon","MultiPolygon","Box","GeometryCollection"],e.type)==-1?OpenLayers.Console.error("Unsupported geometry type: "+e.type):n=!0;break;case"FeatureCollection":n=!0;break;default:e.type==t?n=!0:OpenLayers.Console.error("Cannot convert types from "+e.type+" to "+t)}return n},parseFeature:function(e){var t,n,r,i;r=e.properties?e.properties:{},i=e.geometry&&e.geometry.bbox||e.bbox;try{n=this.parseGeometry(e.geometry)}catch(s){throw s}return t=new OpenLayers.Feature.Vector(n,r),i&&(t.bounds=OpenLayers.Bounds.fromArray(i)),e.id&&(t.fid=e.id),t},parseGeometry:function(e){if(e==null)return null;var t,n=!1;if(e.type=="GeometryCollection"){if(!OpenLayers.Util.isArray(e.geometries))throw"GeometryCollection must have geometries array: "+e;var r=e.geometries.length,i=new Array(r);for(var s=0;s<r;++s)i[s]=this.parseGeometry.apply(this,[e.geometries[s]]);t=new OpenLayers.Geometry.Collection(i),n=!0}else{if(!OpenLayers.Util.isArray(e.coordinates))throw"Geometry must have coordinates array: "+e;if(!this.parseCoords[e.type.toLowerCase()])throw"Unsupported geometry type: "+e.type;try{t=this.parseCoords[e.type.toLowerCase()].apply(this,[e.coordinates])}catch(o){throw o}}return this.internalProjection&&this.externalProjection&&!n&&t.transform(this.externalProjection,this.internalProjection),t},parseCoords:{point:function(e){if(this.ignoreExtraDims==0&&e.length!=2)throw"Only 2D points are supported: "+e;return new OpenLayers.Geometry.Point(e[0],e[1])},multipoint:function(e){var t=[],n=null;for(var r=0,i=e.length;r<i;++r){try{n=this.parseCoords.point.apply(this,[e[r]])}catch(s){throw s}t.push(n)}return new OpenLayers.Geometry.MultiPoint(t)},linestring:function(e){var t=[],n=null;for(var r=0,i=e.length;r<i;++r){try{n=this.parseCoords.point.apply(this,[e[r]])}catch(s){throw s}t.push(n)}return new OpenLayers.Geometry.LineString(t)},multilinestring:function(e){var t=[],n=null;for(var r=0,i=e.length;r<i;++r){try{n=this.parseCoords.linestring.apply(this,[e[r]])}catch(s){throw s}t.push(n)}return new OpenLayers.Geometry.MultiLineString(t)},polygon:function(e){var t=[],n,r;for(var i=0,s=e.length;i<s;++i){try{r=this.parseCoords.linestring.apply(this,[e[i]])}catch(o){throw o}n=new OpenLayers.Geometry.LinearRing(r.components),t.push(n)}return new OpenLayers.Geometry.Polygon(t)},multipolygon:function(e){var t=[],n=null;for(var r=0,i=e.length;r<i;++r){try{n=this.parseCoords.polygon.apply(this,[e[r]])}catch(s){throw s}t.push(n)}return new OpenLayers.Geometry.MultiPolygon(t)},box:function(e){if(e.length!=2)throw"GeoJSON box coordinates must have 2 elements";return new OpenLayers.Geometry.Polygon([new OpenLayers.Geometry.LinearRing([new OpenLayers.Geometry.Point(e[0][0],e[0][1]),new OpenLayers.Geometry.Point(e[1][0],e[0][1]),new OpenLayers.Geometry.Point(e[1][0],e[1][1]),new OpenLayers.Geometry.Point(e[0][0],e[1][1]),new OpenLayers.Geometry.Point(e[0][0],e[0][1])])])}},write:function(e,t){var n={type:null};if(OpenLayers.Util.isArray(e)){n.type="FeatureCollection";var r=e.length;n.features=new Array(r);for(var i=0;i<r;++i){var s=e[i];if(!s instanceof OpenLayers.Feature.Vector){var o="FeatureCollection only supports collections of features: "+s;throw o}n.features[i]=this.extract.feature.apply(this,[s])}}else e.CLASS_NAME.indexOf("OpenLayers.Geometry")==0?n=this.extract.geometry.apply(this,[e]):e instanceof OpenLayers.Feature.Vector&&(n=this.extract.feature.apply(this,[e]),e.layer&&e.layer.projection&&(n.crs=this.createCRSObject(e)));return OpenLayers.Format.JSON.prototype.write.apply(this,[n,t])},createCRSObject:function(e){var t=e.layer.projection.toString(),n={};if(t.match(/epsg:/i)){var r=parseInt(t.substring(t.indexOf(":")+1));r==4326?n={type:"name",properties:{name:"urn:ogc:def:crs:OGC:1.3:CRS84"}}:n={type:"name",properties:{name:"EPSG:"+r}}}return n},extract:{feature:function(e){var t=this.extract.geometry.apply(this,[e.geometry]),n={type:"Feature",properties:e.attributes,geometry:t};return e.fid!=null&&(n.id=e.fid),n},geometry:function(e){if(e==null)return null;this.internalProjection&&this.externalProjection&&(e=e.clone(),e.transform(this.internalProjection,this.externalProjection));var t=e.CLASS_NAME.split(".")[2],n=this.extract[t.toLowerCase()].apply(this,[e]),r;return t=="Collection"?r={type:"GeometryCollection",geometries:n}:r={type:t,coordinates:n},r},point:function(e){return[e.x,e.y]},multipoint:function(e){var t=[];for(var n=0,r=e.components.length;n<r;++n)t.push(this.extract.point.apply(this,[e.components[n]]));return t},linestring:function(e){var t=[];for(var n=0,r=e.components.length;n<r;++n)t.push(this.extract.point.apply(this,[e.components[n]]));return t},multilinestring:function(e){var t=[];for(var n=0,r=e.components.length;n<r;++n)t.push(this.extract.linestring.apply(this,[e.components[n]]));return t},polygon:function(e){var t=[];for(var n=0,r=e.components.length;n<r;++n)t.push(this.extract.linestring.apply(this,[e.components[n]]));return t},multipolygon:function(e){var t=[];for(var n=0,r=e.components.length;n<r;++n)t.push(this.extract.polygon.apply(this,[e.components[n]]));return t},collection:function(e){var t=e.components.length,n=new Array(t);for(var r=0;r<t;++r)n[r]=this.extract.geometry.apply(this,[e.components[r]]);return n}},CLASS_NAME:"OpenLayers.Format.GeoJSON"});