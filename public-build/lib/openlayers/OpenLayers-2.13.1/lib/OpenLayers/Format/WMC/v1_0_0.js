/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Format.WMC.v1_0_0=OpenLayers.Class(OpenLayers.Format.WMC.v1,{VERSION:"1.0.0",schemaLocation:"http://www.opengis.net/context http://schemas.opengis.net/context/1.0.0/context.xsd",initialize:function(e){OpenLayers.Format.WMC.v1.prototype.initialize.apply(this,[e])},read_wmc_SRS:function(e,t){var n=this.getChildValue(t);typeof e.projections!="object"&&(e.projections={});var r=n.split(/ +/);for(var i=0,s=r.length;i<s;i++)e.projections[r[i]]=!0},write_wmc_Layer:function(e){var t=OpenLayers.Format.WMC.v1.prototype.write_wmc_Layer.apply(this,[e]);if(e.srs){var n=[];for(var r in e.srs)n.push(r);t.appendChild(this.createElementDefaultNS("SRS",n.join(" ")))}t.appendChild(this.write_wmc_FormatList(e)),t.appendChild(this.write_wmc_StyleList(e)),e.dimensions&&t.appendChild(this.write_wmc_DimensionList(e)),t.appendChild(this.write_wmc_LayerExtension(e))},CLASS_NAME:"OpenLayers.Format.WMC.v1_0_0"});