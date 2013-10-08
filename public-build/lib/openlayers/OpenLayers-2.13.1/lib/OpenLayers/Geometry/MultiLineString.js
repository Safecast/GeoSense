/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Geometry.MultiLineString=OpenLayers.Class(OpenLayers.Geometry.Collection,{componentTypes:["OpenLayers.Geometry.LineString"],split:function(e,t){var n=null,r=t&&t.mutual,i,s,o,u,a,f=[],l=[e];for(var c=0,h=this.components.length;c<h;++c){s=this.components[c],u=!1;for(var p=0;p<l.length;++p){i=s.split(l[p],t);if(i){if(r){o=i[0];for(var d=0,v=o.length;d<v;++d)d===0&&f.length?f[f.length-1].addComponent(o[d]):f.push(new OpenLayers.Geometry.MultiLineString([o[d]]));u=!0,i=i[1]}if(i.length){i.unshift(p,1),Array.prototype.splice.apply(l,i);break}}}u||(f.length?f[f.length-1].addComponent(s.clone()):f=[new OpenLayers.Geometry.MultiLineString(s.clone())])}f&&f.length>1?u=!0:f=[],l&&l.length>1?a=!0:l=[];if(u||a)r?n=[f,l]:n=l;return n},splitWith:function(e,t){var n=null,r=t&&t.mutual,i,s,o,u,a,f,l;if(e instanceof OpenLayers.Geometry.LineString){l=[],f=[e];for(var c=0,h=this.components.length;c<h;++c){a=!1,s=this.components[c];for(var p=0;p<f.length;++p){i=f[p].split(s,t);if(i){r&&(o=i[0],o.length&&(o.unshift(p,1),Array.prototype.splice.apply(f,o),p+=o.length-2),i=i[1],i.length===0&&(i=[s.clone()]));for(var d=0,v=i.length;d<v;++d)d===0&&l.length?l[l.length-1].addComponent(i[d]):l.push(new OpenLayers.Geometry.MultiLineString([i[d]]));a=!0}}a||(l.length?l[l.length-1].addComponent(s.clone()):l=[new OpenLayers.Geometry.MultiLineString([s.clone()])])}}else n=e.split(this);f&&f.length>1?u=!0:f=[],l&&l.length>1?a=!0:l=[];if(u||a)r?n=[f,l]:n=l;return n},CLASS_NAME:"OpenLayers.Geometry.MultiLineString"});