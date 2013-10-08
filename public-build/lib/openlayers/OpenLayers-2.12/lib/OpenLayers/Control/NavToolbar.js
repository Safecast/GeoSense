/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Control.NavToolbar=OpenLayers.Class(OpenLayers.Control.Panel,{initialize:function(e){OpenLayers.Control.Panel.prototype.initialize.apply(this,[e]),this.addControls([new OpenLayers.Control.Navigation,new OpenLayers.Control.ZoomBox])},draw:function(){var e=OpenLayers.Control.Panel.prototype.draw.apply(this,arguments);return this.defaultControl===null&&(this.defaultControl=this.controls[0]),e},CLASS_NAME:"OpenLayers.Control.NavToolbar"});