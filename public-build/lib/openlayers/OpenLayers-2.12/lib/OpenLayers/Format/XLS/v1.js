/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Format.XLS.v1=OpenLayers.Class(OpenLayers.Format.XML,{namespaces:{xls:"http://www.opengis.net/xls",gml:"http://www.opengis.net/gml",xsi:"http://www.w3.org/2001/XMLSchema-instance"},regExes:{trimSpace:/^\s*|\s*$/g,removeSpace:/\s*/g,splitSpace:/\s+/,trimComma:/\s*,\s*/g},xy:!0,defaultPrefix:"xls",schemaLocation:null,read:function(e,t){t=OpenLayers.Util.applyDefaults(t,this.options);var n={};return this.readChildNodes(e,n),n},readers:{xls:{XLS:function(e,t){t.version=e.getAttribute("version"),this.readChildNodes(e,t)},Response:function(e,t){this.readChildNodes(e,t)},GeocodeResponse:function(e,t){t.responseLists=[],this.readChildNodes(e,t)},GeocodeResponseList:function(e,t){var n={features:[],numberOfGeocodedAddresses:parseInt(e.getAttribute("numberOfGeocodedAddresses"))};t.responseLists.push(n),this.readChildNodes(e,n)},GeocodedAddress:function(e,t){var n=new OpenLayers.Feature.Vector;t.features.push(n),this.readChildNodes(e,n),n.geometry=n.components[0]},GeocodeMatchCode:function(e,t){t.attributes.matchCode={accuracy:parseFloat(e.getAttribute("accuracy")),matchType:e.getAttribute("matchType")}},Address:function(e,t){var n={countryCode:e.getAttribute("countryCode"),addressee:e.getAttribute("addressee"),street:[],place:[]};t.attributes.address=n,this.readChildNodes(e,n)},freeFormAddress:function(e,t){t.freeFormAddress=this.getChildValue(e)},StreetAddress:function(e,t){this.readChildNodes(e,t)},Building:function(e,t){t.building={number:e.getAttribute("number"),subdivision:e.getAttribute("subdivision"),buildingName:e.getAttribute("buildingName")}},Street:function(e,t){t.street.push(this.getChildValue(e))},Place:function(e,t){t.place[e.getAttribute("type")]=this.getChildValue(e)},PostalCode:function(e,t){t.postalCode=this.getChildValue(e)}},gml:OpenLayers.Format.GML.v3.prototype.readers.gml},write:function(e){return this.writers.xls.XLS.apply(this,[e])},writers:{xls:{XLS:function(e){var t=this.createElementNSPlus("xls:XLS",{attributes:{version:this.VERSION,"xsi:schemaLocation":this.schemaLocation}});return this.writeNode("RequestHeader",e.header,t),this.writeNode("Request",e,t),t},RequestHeader:function(e){return this.createElementNSPlus("xls:RequestHeader")},Request:function(e){var t=this.createElementNSPlus("xls:Request",{attributes:{methodName:"GeocodeRequest",requestID:e.requestID||"",version:this.VERSION}});return this.writeNode("GeocodeRequest",e.addresses,t),t},GeocodeRequest:function(e){var t=this.createElementNSPlus("xls:GeocodeRequest");for(var n=0,r=e.length;n<r;n++)this.writeNode("Address",e[n],t);return t},Address:function(e){var t=this.createElementNSPlus("xls:Address",{attributes:{countryCode:e.countryCode}});return e.freeFormAddress?this.writeNode("freeFormAddress",e.freeFormAddress,t):(e.street&&this.writeNode("StreetAddress",e,t),e.municipality&&this.writeNode("Municipality",e.municipality,t),e.countrySubdivision&&this.writeNode("CountrySubdivision",e.countrySubdivision,t),e.postalCode&&this.writeNode("PostalCode",e.postalCode,t)),t},freeFormAddress:function(e){return this.createElementNSPlus("freeFormAddress",{value:e})},StreetAddress:function(e){var t=this.createElementNSPlus("xls:StreetAddress");e.building&&this.writeNode(t,"Building",e.building);var n=e.street;OpenLayers.Util.isArray(n)||(n=[n]);for(var r=0,i=n.length;r<i;r++)this.writeNode("Street",n[r],t);return t},Building:function(e){return this.createElementNSPlus("xls:Building",{attributes:{number:e.number,subdivision:e.subdivision,buildingName:e.buildingName}})},Street:function(e){return this.createElementNSPlus("xls:Street",{value:e})},Municipality:function(e){return this.createElementNSPlus("xls:Place",{attributes:{type:"Municipality"},value:e})},CountrySubdivision:function(e){return this.createElementNSPlus("xls:Place",{attributes:{type:"CountrySubdivision"},value:e})},PostalCode:function(e){return this.createElementNSPlus("xls:PostalCode",{value:e})}}},CLASS_NAME:"OpenLayers.Format.XLS.v1"});