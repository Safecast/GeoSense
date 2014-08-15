/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Format.OWSContext=OpenLayers.Class(OpenLayers.Format.Context,{defaultVersion:"0.3.1",getVersion:function(e,t){var n=OpenLayers.Format.XML.VersionedOGC.prototype.getVersion.apply(this,arguments);return n==="0.3.0"&&(n=this.defaultVersion),n},toContext:function(e){var t={};return e.CLASS_NAME=="OpenLayers.Map"&&(t.bounds=e.getExtent(),t.maxExtent=e.maxExtent,t.projection=e.projection,t.size=e.getSize(),t.layers=e.layers),t},CLASS_NAME:"OpenLayers.Format.OWSContext"});