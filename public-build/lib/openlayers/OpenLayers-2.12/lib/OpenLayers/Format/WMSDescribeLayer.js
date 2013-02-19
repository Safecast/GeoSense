/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Format.WMSDescribeLayer=OpenLayers.Class(OpenLayers.Format.XML.VersionedOGC,{defaultVersion:"1.1.1",getVersion:function(e,t){var n=OpenLayers.Format.XML.VersionedOGC.prototype.getVersion.apply(this,arguments);if(n=="1.1.1"||n=="1.1.0")n="1.1";return n},CLASS_NAME:"OpenLayers.Format.WMSDescribeLayer"});