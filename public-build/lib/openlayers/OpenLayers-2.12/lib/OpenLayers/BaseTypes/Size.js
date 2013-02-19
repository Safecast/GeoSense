/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Size=OpenLayers.Class({w:0,h:0,initialize:function(e,t){this.w=parseFloat(e),this.h=parseFloat(t)},toString:function(){return"w="+this.w+",h="+this.h},clone:function(){return new OpenLayers.Size(this.w,this.h)},equals:function(e){var t=!1;return e!=null&&(t=this.w==e.w&&this.h==e.h||isNaN(this.w)&&isNaN(this.h)&&isNaN(e.w)&&isNaN(e.h)),t},CLASS_NAME:"OpenLayers.Size"});