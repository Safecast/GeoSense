/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Format.WFS=OpenLayers.Class(OpenLayers.Format.GML,{layer:null,wfsns:"http://www.opengis.net/wfs",ogcns:"http://www.opengis.net/ogc",initialize:function(e,t){OpenLayers.Format.GML.prototype.initialize.apply(this,[e]),this.layer=t,this.layer.featureNS&&(this.featureNS=this.layer.featureNS),this.layer.options.geometry_column&&(this.geometryName=this.layer.options.geometry_column),this.layer.options.typename&&(this.featureName=this.layer.options.typename)},write:function(e){var t=this.createElementNS(this.wfsns,"wfs:Transaction");t.setAttribute("version","1.0.0"),t.setAttribute("service","WFS");for(var n=0;n<e.length;n++)switch(e[n].state){case OpenLayers.State.INSERT:t.appendChild(this.insert(e[n]));break;case OpenLayers.State.UPDATE:t.appendChild(this.update(e[n]));break;case OpenLayers.State.DELETE:t.appendChild(this.remove(e[n]))}return OpenLayers.Format.XML.prototype.write.apply(this,[t])},createFeatureXML:function(e){var t=this.buildGeometryNode(e.geometry),n=this.createElementNS(this.featureNS,"feature:"+this.geometryName);n.appendChild(t);var r=this.createElementNS(this.featureNS,"feature:"+this.featureName);r.appendChild(n);for(var i in e.attributes){var s=this.createTextNode(e.attributes[i]),o=i;i.search(":")!=-1&&(o=i.split(":")[1]);var u=this.createElementNS(this.featureNS,"feature:"+o);u.appendChild(s),r.appendChild(u)}return r},insert:function(e){var t=this.createElementNS(this.wfsns,"wfs:Insert");return t.appendChild(this.createFeatureXML(e)),t},update:function(e){e.fid||OpenLayers.Console.userError(OpenLayers.i18n("noFID"));var t=this.createElementNS(this.wfsns,"wfs:Update");t.setAttribute("typeName",this.featurePrefix+":"+this.featureName),t.setAttribute("xmlns:"+this.featurePrefix,this.featureNS);var n=this.createElementNS(this.wfsns,"wfs:Property"),r=this.createElementNS(this.wfsns,"wfs:Name"),i=this.createTextNode(this.geometryName);r.appendChild(i),n.appendChild(r);var s=this.createElementNS(this.wfsns,"wfs:Value"),o=this.buildGeometryNode(e.geometry);e.layer&&o.setAttribute("srsName",e.layer.projection.getCode()),s.appendChild(o),n.appendChild(s),t.appendChild(n);for(var u in e.attributes)n=this.createElementNS(this.wfsns,"wfs:Property"),r=this.createElementNS(this.wfsns,"wfs:Name"),r.appendChild(this.createTextNode(u)),n.appendChild(r),s=this.createElementNS(this.wfsns,"wfs:Value"),s.appendChild(this.createTextNode(e.attributes[u])),n.appendChild(s),t.appendChild(n);var a=this.createElementNS(this.ogcns,"ogc:Filter"),f=this.createElementNS(this.ogcns,"ogc:FeatureId");return f.setAttribute("fid",e.fid),a.appendChild(f),t.appendChild(a),t},remove:function(e){if(!e.fid)return OpenLayers.Console.userError(OpenLayers.i18n("noFID")),!1;var t=this.createElementNS(this.wfsns,"wfs:Delete");t.setAttribute("typeName",this.featurePrefix+":"+this.featureName),t.setAttribute("xmlns:"+this.featurePrefix,this.featureNS);var n=this.createElementNS(this.ogcns,"ogc:Filter"),r=this.createElementNS(this.ogcns,"ogc:FeatureId");return r.setAttribute("fid",e.fid),n.appendChild(r),t.appendChild(n),t},destroy:function(){this.layer=null},CLASS_NAME:"OpenLayers.Format.WFS"});