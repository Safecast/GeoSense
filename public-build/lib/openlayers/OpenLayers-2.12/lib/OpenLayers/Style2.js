/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Style2=OpenLayers.Class({id:null,name:null,title:null,description:null,layerName:null,isDefault:!1,rules:null,initialize:function(e){OpenLayers.Util.extend(this,e),this.id=OpenLayers.Util.createUniqueID(this.CLASS_NAME+"_")},destroy:function(){for(var e=0,t=this.rules.length;e<t;e++)this.rules[e].destroy();delete this.rules},clone:function(){var e=OpenLayers.Util.extend({},this);if(this.rules){e.rules=[];for(var t=0,n=this.rules.length;t<n;++t)e.rules.push(this.rules[t].clone())}return new OpenLayers.Style2(e)},CLASS_NAME:"OpenLayers.Style2"});