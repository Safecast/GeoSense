/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Format.WPSDescribeProcess=OpenLayers.Class(OpenLayers.Format.XML,{VERSION:"1.0.0",namespaces:{wps:"http://www.opengis.net/wps/1.0.0",ows:"http://www.opengis.net/ows/1.1",xsi:"http://www.w3.org/2001/XMLSchema-instance"},schemaLocation:"http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd",defaultPrefix:"wps",regExes:{trimSpace:/^\s*|\s*$/g,removeSpace:/\s*/g,splitSpace:/\s+/,trimComma:/\s*,\s*/g},read:function(e){typeof e=="string"&&(e=OpenLayers.Format.XML.prototype.read.apply(this,[e])),e&&e.nodeType==9&&(e=e.documentElement);var t={};return this.readNode(e,t),t},readers:{wps:{ProcessDescriptions:function(e,t){t.processDescriptions={},this.readChildNodes(e,t.processDescriptions)},ProcessDescription:function(e,t){var n=this.getAttributeNS(e,this.namespaces.wps,"processVersion"),r={processVersion:n,statusSupported:e.getAttribute("statusSupported")==="true",storeSupported:e.getAttribute("storeSupported")==="true"};this.readChildNodes(e,r),t[r.identifier]=r},DataInputs:function(e,t){t.dataInputs=[],this.readChildNodes(e,t.dataInputs)},ProcessOutputs:function(e,t){t.processOutputs=[],this.readChildNodes(e,t.processOutputs)},Output:function(e,t){var n={};this.readChildNodes(e,n),t.push(n)},ComplexOutput:function(e,t){t.complexOutput={},this.readChildNodes(e,t.complexOutput)},Input:function(e,t){var n={maxOccurs:parseInt(e.getAttribute("maxOccurs")),minOccurs:parseInt(e.getAttribute("minOccurs"))};this.readChildNodes(e,n),t.push(n)},BoundingBoxData:function(e,t){t.boundingBoxData={},this.readChildNodes(e,t.boundingBoxData)},CRS:function(e,t){t.CRSs||(t.CRSs={}),t.CRSs[this.getChildValue(e)]=!0},LiteralData:function(e,t){t.literalData={},this.readChildNodes(e,t.literalData)},ComplexData:function(e,t){t.complexData={},this.readChildNodes(e,t.complexData)},Default:function(e,t){t["default"]={},this.readChildNodes(e,t["default"])},Supported:function(e,t){t.supported={},this.readChildNodes(e,t.supported)},Format:function(e,t){var n={};this.readChildNodes(e,n),t.formats||(t.formats={}),t.formats[n.mimeType]=!0},MimeType:function(e,t){t.mimeType=this.getChildValue(e)}},ows:OpenLayers.Format.OWSCommon.v1_1_0.prototype.readers.ows},CLASS_NAME:"OpenLayers.Format.WPSDescribeProcess"});