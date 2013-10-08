/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Format.OWSContext.v0_3_1=OpenLayers.Class(OpenLayers.Format.XML,{namespaces:{owc:"http://www.opengis.net/ows-context",gml:"http://www.opengis.net/gml",kml:"http://www.opengis.net/kml/2.2",ogc:"http://www.opengis.net/ogc",ows:"http://www.opengis.net/ows",sld:"http://www.opengis.net/sld",xlink:"http://www.w3.org/1999/xlink",xsi:"http://www.w3.org/2001/XMLSchema-instance"},VERSION:"0.3.1",schemaLocation:"http://www.opengis.net/ows-context http://www.ogcnetwork.net/schemas/owc/0.3.1/owsContext.xsd",defaultPrefix:"owc",extractAttributes:!0,xy:!0,regExes:{trimSpace:/^\s*|\s*$/g,removeSpace:/\s*/g,splitSpace:/\s+/,trimComma:/\s*,\s*/g},featureNS:"http://mapserver.gis.umn.edu/mapserver",featureType:"vector",geometryName:"geometry",nestingLayerLookup:null,initialize:function(e){OpenLayers.Format.XML.prototype.initialize.apply(this,[e]),OpenLayers.Format.GML.v2.prototype.setGeometryTypes.call(this)},setNestingPath:function(e){if(e.layersContext)for(var t=0,n=e.layersContext.length;t<n;t++){var r=e.layersContext[t],i=[],s=e.title||"";e.metadata&&e.metadata.nestingPath&&(i=e.metadata.nestingPath.slice()),s!=""&&i.push(s),r.metadata.nestingPath=i,r.layersContext&&this.setNestingPath(r)}},decomposeNestingPath:function(e){var t=[];if(OpenLayers.Util.isArray(e)){var n=e.slice();while(n.length>0)t.push(n.slice()),n.pop();t.reverse()}return t},read:function(e){typeof e=="string"&&(e=OpenLayers.Format.XML.prototype.read.apply(this,[e])),e&&e.nodeType==9&&(e=e.documentElement);var t={};this.readNode(e,t),this.setNestingPath({layersContext:t.layersContext});var n=[];return this.processLayer(n,t),delete t.layersContext,t.layersContext=n,t},processLayer:function(e,t){if(t.layersContext)for(var n=0,r=t.layersContext.length;n<r;n++){var i=t.layersContext[n];e.push(i),i.layersContext&&this.processLayer(e,i)}},write:function(e,t){var n="OWSContext";this.nestingLayerLookup={},t=t||{},OpenLayers.Util.applyDefaults(t,e);var r=this.writeNode(n,t);return this.nestingLayerLookup=null,this.setAttributeNS(r,this.namespaces.xsi,"xsi:schemaLocation",this.schemaLocation),OpenLayers.Format.XML.prototype.write.apply(this,[r])},readers:{kml:{Document:function(e,t){t.features=(new OpenLayers.Format.KML({kmlns:this.namespaces.kml,extractStyles:!0})).read(e)}},owc:{OWSContext:function(e,t){this.readChildNodes(e,t)},General:function(e,t){this.readChildNodes(e,t)},ResourceList:function(e,t){this.readChildNodes(e,t)},Layer:function(e,t){var n={metadata:{},visibility:e.getAttribute("hidden")!="1",queryable:e.getAttribute("queryable")=="1",opacity:e.getAttribute("opacity")!=null?parseFloat(e.getAttribute("opacity")):null,name:e.getAttribute("name"),categoryLayer:e.getAttribute("name")==null,formats:[],styles:[]};t.layersContext||(t.layersContext=[]),t.layersContext.push(n),this.readChildNodes(e,n)},InlineGeometry:function(e,t){t.features=[];var n=this.getElementsByTagNameNS(e,this.namespaces.gml,"featureMember"),r;n.length>=1&&(r=n[0]);if(r&&r.firstChild){var i=r.firstChild.nextSibling?r.firstChild.nextSibling:r.firstChild;this.setNamespace("feature",i.namespaceURI),this.featureType=i.localName||i.nodeName.split(":").pop(),this.readChildNodes(e,t)}},Server:function(e,t){if(!t.service&&!t.version||t.service!=OpenLayers.Format.Context.serviceTypes.WMS)t.service=e.getAttribute("service"),t.version=e.getAttribute("version"),this.readChildNodes(e,t)},Name:function(e,t){t.name=this.getChildValue(e),this.readChildNodes(e,t)},Title:function(e,t){t.title=this.getChildValue(e),this.readChildNodes(e,t)},StyleList:function(e,t){this.readChildNodes(e,t.styles)},Style:function(e,t){var n={};t.push(n),this.readChildNodes(e,n)},LegendURL:function(e,t){var n={};t.legend=n,this.readChildNodes(e,n)},OnlineResource:function(e,t){t.url=this.getAttributeNS(e,this.namespaces.xlink,"href"),this.readChildNodes(e,t)}},ows:OpenLayers.Format.OWSCommon.v1_0_0.prototype.readers.ows,gml:OpenLayers.Format.GML.v2.prototype.readers.gml,sld:OpenLayers.Format.SLD.v1_0_0.prototype.readers.sld,feature:OpenLayers.Format.GML.v2.prototype.readers.feature},writers:{owc:{OWSContext:function(e){var t=this.createElementNSPlus("OWSContext",{attributes:{version:this.VERSION,id:e.id||OpenLayers.Util.createUniqueID("OpenLayers_OWSContext_")}});return this.writeNode("General",e,t),this.writeNode("ResourceList",e,t),t},General:function(e){var t=this.createElementNSPlus("General");return this.writeNode("ows:BoundingBox",e,t),this.writeNode("ows:Title",e.title||"OpenLayers OWSContext",t),t},ResourceList:function(e){var t=this.createElementNSPlus("ResourceList");for(var n=0,r=e.layers.length;n<r;n++){var i=e.layers[n],s=this.decomposeNestingPath(i.metadata.nestingPath);this.writeNode("_Layer",{layer:i,subPaths:s},t)}return t},Server:function(e){var t=this.createElementNSPlus("Server",{attributes:{version:e.version,service:e.service}});return this.writeNode("OnlineResource",e,t),t},OnlineResource:function(e){var t=this.createElementNSPlus("OnlineResource",{attributes:{"xlink:href":e.url}});return t},InlineGeometry:function(e){var t=this.createElementNSPlus("InlineGeometry");this.writeNode("gml:boundedBy",e.getDataExtent(),t);for(var n=0,r=e.features.length;n<r;n++)this.writeNode("gml:featureMember",e.features[n],t);return t},StyleList:function(e){var t=this.createElementNSPlus("StyleList");for(var n=0,r=e.length;n<r;n++)this.writeNode("Style",e[n],t);return t},Style:function(e){var t=this.createElementNSPlus("Style");return this.writeNode("Name",e,t),this.writeNode("Title",e,t),e.legend&&this.writeNode("LegendURL",e,t),t},Name:function(e){var t=this.createElementNSPlus("Name",{value:e.name});return t},Title:function(e){var t=this.createElementNSPlus("Title",{value:e.title});return t},LegendURL:function(e){var t=this.createElementNSPlus("LegendURL");return this.writeNode("OnlineResource",e.legend,t),t},_WMS:function(e){var t=this.createElementNSPlus("Layer",{attributes:{name:e.params.LAYERS,queryable:e.queryable?"1":"0",hidden:e.visibility?"0":"1",opacity:e.hasOwnProperty("opacity")?e.opacity:null}});return this.writeNode("ows:Title",e.name,t),this.writeNode("ows:OutputFormat",e.params.FORMAT,t),this.writeNode("Server",{service:OpenLayers.Format.Context.serviceTypes.WMS,version:e.params.VERSION,url:e.url},t),e.metadata.styles&&e.metadata.styles.length>0&&this.writeNode("StyleList",e.metadata.styles,t),t},_Layer:function(e){var t,n,r,i;t=e.layer,n=e.subPaths,r=null,i=null;if(n.length>0){var s=n[0].join("/"),o=s.lastIndexOf("/");return r=this.nestingLayerLookup[s],i=o>0?s.substring(o+1,s.length):s,r||(r=this.createElementNSPlus("Layer"),this.writeNode("ows:Title",i,r),this.nestingLayerLookup[s]=r),e.subPaths.shift(),this.writeNode("_Layer",e,r),r}return t instanceof OpenLayers.Layer.WMS?r=this.writeNode("_WMS",t):t instanceof OpenLayers.Layer.Vector&&(t.protocol instanceof OpenLayers.Protocol.WFS.v1?r=this.writeNode("_WFS",t):t.protocol instanceof OpenLayers.Protocol.HTTP?t.protocol.format instanceof OpenLayers.Format.GML?(t.protocol.format.version="2.1.2",r=this.writeNode("_GML",t)):t.protocol.format instanceof OpenLayers.Format.KML&&(t.protocol.format.version="2.2",r=this.writeNode("_KML",t)):(this.setNamespace("feature",this.featureNS),r=this.writeNode("_InlineGeometry",t))),t.options.maxScale&&this.writeNode("sld:MinScaleDenominator",t.options.maxScale,r),t.options.minScale&&this.writeNode("sld:MaxScaleDenominator",t.options.minScale,r),this.nestingLayerLookup[t.name]=r,r},_WFS:function(e){var t=this.createElementNSPlus("Layer",{attributes:{name:e.protocol.featurePrefix+":"+e.protocol.featureType,hidden:e.visibility?"0":"1"}});return this.writeNode("ows:Title",e.name,t),this.writeNode("Server",{service:OpenLayers.Format.Context.serviceTypes.WFS,version:e.protocol.version,url:e.protocol.url},t),t},_InlineGeometry:function(e){var t=this.createElementNSPlus("Layer",{attributes:{name:this.featureType,hidden:e.visibility?"0":"1"}});return this.writeNode("ows:Title",e.name,t),this.writeNode("InlineGeometry",e,t),t},_GML:function(e){var t=this.createElementNSPlus("Layer");return this.writeNode("ows:Title",e.name,t),this.writeNode("Server",{service:OpenLayers.Format.Context.serviceTypes.GML,url:e.protocol.url,version:e.protocol.format.version},t),t},_KML:function(e){var t=this.createElementNSPlus("Layer");return this.writeNode("ows:Title",e.name,t),this.writeNode("Server",{service:OpenLayers.Format.Context.serviceTypes.KML,version:e.protocol.format.version,url:e.protocol.url},t),t}},gml:OpenLayers.Util.applyDefaults({boundedBy:function(e){var t=this.createElementNSPlus("gml:boundedBy");return this.writeNode("gml:Box",e,t),t}},OpenLayers.Format.GML.v2.prototype.writers.gml),ows:OpenLayers.Format.OWSCommon.v1_0_0.prototype.writers.ows,sld:OpenLayers.Format.SLD.v1_0_0.prototype.writers.sld,feature:OpenLayers.Format.GML.v2.prototype.writers.feature},CLASS_NAME:"OpenLayers.Format.OWSContext.v0_3_1"});