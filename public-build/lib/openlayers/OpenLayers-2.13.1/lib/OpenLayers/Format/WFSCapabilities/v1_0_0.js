/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Format.WFSCapabilities.v1_0_0=OpenLayers.Class(OpenLayers.Format.WFSCapabilities.v1,{readers:{wfs:OpenLayers.Util.applyDefaults({Service:function(e,t){t.service={},this.readChildNodes(e,t.service)},Fees:function(e,t){var n=this.getChildValue(e);n&&n.toLowerCase()!="none"&&(t.fees=n)},AccessConstraints:function(e,t){var n=this.getChildValue(e);n&&n.toLowerCase()!="none"&&(t.accessConstraints=n)},OnlineResource:function(e,t){var n=this.getChildValue(e);n&&n.toLowerCase()!="none"&&(t.onlineResource=n)},Keywords:function(e,t){var n=this.getChildValue(e);n&&n.toLowerCase()!="none"&&(t.keywords=n.split(", "))},Capability:function(e,t){t.capability={},this.readChildNodes(e,t.capability)},Request:function(e,t){t.request={},this.readChildNodes(e,t.request)},GetFeature:function(e,t){t.getfeature={href:{},formats:[]},this.readChildNodes(e,t.getfeature)},ResultFormat:function(e,t){var n=e.childNodes,r;for(var i=0;i<n.length;i++)r=n[i],r.nodeType==1&&t.formats.push(r.nodeName)},DCPType:function(e,t){this.readChildNodes(e,t)},HTTP:function(e,t){this.readChildNodes(e,t.href)},Get:function(e,t){t.get=e.getAttribute("onlineResource")},Post:function(e,t){t.post=e.getAttribute("onlineResource")},SRS:function(e,t){var n=this.getChildValue(e);n&&(t.srs=n)}},OpenLayers.Format.WFSCapabilities.v1.prototype.readers.wfs)},CLASS_NAME:"OpenLayers.Format.WFSCapabilities.v1_0_0"});