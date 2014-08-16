/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Format.OWSCommon=OpenLayers.Class(OpenLayers.Format.XML.VersionedOGC,{defaultVersion:"1.0.0",getVersion:function(e,t){var n=this.version;if(!n){var r=e.getAttribute("xmlns:ows");r&&r.substring(r.lastIndexOf("/")+1)==="1.1"&&(n="1.1.0"),n||(n=this.defaultVersion)}return n},CLASS_NAME:"OpenLayers.Format.OWSCommon"});