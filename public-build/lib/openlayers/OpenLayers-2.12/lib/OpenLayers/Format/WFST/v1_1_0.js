/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Format.WFST.v1_1_0=OpenLayers.Class(OpenLayers.Format.Filter.v1_1_0,OpenLayers.Format.WFST.v1,{version:"1.1.0",schemaLocations:{wfs:"http://schemas.opengis.net/wfs/1.1.0/wfs.xsd"},initialize:function(e){OpenLayers.Format.Filter.v1_1_0.prototype.initialize.apply(this,[e]),OpenLayers.Format.WFST.v1.prototype.initialize.apply(this,[e])},readNode:function(e,t,n){return OpenLayers.Format.GML.v3.prototype.readNode.apply(this,[e,t])},readers:{wfs:OpenLayers.Util.applyDefaults({FeatureCollection:function(e,t){t.numberOfFeatures=parseInt(e.getAttribute("numberOfFeatures")),OpenLayers.Format.WFST.v1.prototype.readers.wfs.FeatureCollection.apply(this,arguments)},TransactionResponse:function(e,t){t.insertIds=[],t.success=!1,this.readChildNodes(e,t)},TransactionSummary:function(e,t){t.success=!0},InsertResults:function(e,t){this.readChildNodes(e,t)},Feature:function(e,t){var n={fids:[]};this.readChildNodes(e,n),t.insertIds.push(n.fids[0])}},OpenLayers.Format.WFST.v1.prototype.readers.wfs),gml:OpenLayers.Format.GML.v3.prototype.readers.gml,feature:OpenLayers.Format.GML.v3.prototype.readers.feature,ogc:OpenLayers.Format.Filter.v1_1_0.prototype.readers.ogc,ows:OpenLayers.Format.OWSCommon.v1_0_0.prototype.readers.ows},writers:{wfs:OpenLayers.Util.applyDefaults({GetFeature:function(e){var t=OpenLayers.Format.WFST.v1.prototype.writers.wfs.GetFeature.apply(this,arguments);return e&&this.setAttributes(t,{resultType:e.resultType,startIndex:e.startIndex,count:e.count}),t},Query:function(e){e=OpenLayers.Util.extend({featureNS:this.featureNS,featurePrefix:this.featurePrefix,featureType:this.featureType,srsName:this.srsName},e);var t=e.featurePrefix,n=this.createElementNSPlus("wfs:Query",{attributes:{typeName:(t?t+":":"")+e.featureType,srsName:e.srsName}});e.featureNS&&n.setAttribute("xmlns:"+t,e.featureNS);if(e.propertyNames)for(var r=0,i=e.propertyNames.length;r<i;r++)this.writeNode("wfs:PropertyName",{property:e.propertyNames[r]},n);return e.filter&&(OpenLayers.Format.WFST.v1_1_0.prototype.setFilterProperty.call(this,e.filter),this.writeNode("ogc:Filter",e.filter,n)),n},PropertyName:function(e){return this.createElementNSPlus("wfs:PropertyName",{value:e.property})}},OpenLayers.Format.WFST.v1.prototype.writers.wfs),gml:OpenLayers.Format.GML.v3.prototype.writers.gml,feature:OpenLayers.Format.GML.v3.prototype.writers.feature,ogc:OpenLayers.Format.Filter.v1_1_0.prototype.writers.ogc},CLASS_NAME:"OpenLayers.Format.WFST.v1_1_0"});