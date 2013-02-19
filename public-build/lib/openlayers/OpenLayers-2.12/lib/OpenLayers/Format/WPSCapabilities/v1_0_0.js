/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Format.WPSCapabilities.v1_0_0=OpenLayers.Class(OpenLayers.Format.XML,{namespaces:{ows:"http://www.opengis.net/ows/1.1",wps:"http://www.opengis.net/wps/1.0.0",xlink:"http://www.w3.org/1999/xlink"},regExes:{trimSpace:/^\s*|\s*$/g,removeSpace:/\s*/g,splitSpace:/\s+/,trimComma:/\s*,\s*/g},initialize:function(e){OpenLayers.Format.XML.prototype.initialize.apply(this,[e])},read:function(e){typeof e=="string"&&(e=OpenLayers.Format.XML.prototype.read.apply(this,[e])),e&&e.nodeType==9&&(e=e.documentElement);var t={};return this.readNode(e,t),t},readers:{wps:{Capabilities:function(e,t){this.readChildNodes(e,t)},ProcessOfferings:function(e,t){t.processOfferings={},this.readChildNodes(e,t.processOfferings)},Process:function(e,t){var n=this.getAttributeNS(e,this.namespaces.wps,"processVersion"),r={processVersion:n};this.readChildNodes(e,r),t[r.identifier]=r},Languages:function(e,t){t.languages=[],this.readChildNodes(e,t.languages)},Default:function(e,t){var n={isDefault:!0};this.readChildNodes(e,n),t.push(n)},Supported:function(e,t){var n={};this.readChildNodes(e,n),t.push(n)}},ows:OpenLayers.Format.OWSCommon.v1_1_0.prototype.readers.ows},CLASS_NAME:"OpenLayers.Format.WPSCapabilities.v1_0_0"});