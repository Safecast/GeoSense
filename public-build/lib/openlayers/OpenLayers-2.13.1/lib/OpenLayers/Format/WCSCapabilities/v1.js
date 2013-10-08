/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Format.WCSCapabilities.v1=OpenLayers.Class(OpenLayers.Format.XML,{regExes:{trimSpace:/^\s*|\s*$/g,splitSpace:/\s+/},defaultPrefix:"wcs",read:function(e){typeof e=="string"&&(e=OpenLayers.Format.XML.prototype.read.apply(this,[e]));var t=e;e&&e.nodeType==9&&(e=e.documentElement);var n={};return this.readNode(e,n),n},CLASS_NAME:"OpenLayers.Format.WCSCapabilities.v1"});