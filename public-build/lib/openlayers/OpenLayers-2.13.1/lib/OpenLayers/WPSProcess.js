/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.WPSProcess=OpenLayers.Class({client:null,server:null,identifier:null,description:null,localWPS:"http://geoserver/wps",formats:null,chained:0,executeCallbacks:null,initialize:function(e){OpenLayers.Util.extend(this,e),this.executeCallbacks=[],this.formats={"application/wkt":new OpenLayers.Format.WKT,"application/json":new OpenLayers.Format.GeoJSON}},describe:function(e){e=e||{};if(!this.description)this.client.describeProcess(this.server,this.identifier,function(t){this.description||this.parseDescription(t),e.callback&&e.callback.call(e.scope,this.description)},this);else if(e.callback){var t=this.description;window.setTimeout(function(){e.callback.call(e.scope,t)},0)}},configure:function(e){return this.describe({callback:function(){var t=this.description,n=e.inputs,r,i,s;for(i=0,s=t.dataInputs.length;i<s;++i)r=t.dataInputs[i],this.setInputData(r,n[r.identifier]);e.callback&&e.callback.call(e.scope)},scope:this}),this},execute:function(e){this.configure({inputs:e.inputs,callback:function(){var t=this,n=this.getOutputIndex(t.description.processOutputs,e.output);t.setResponseForm({outputIndex:n}),function r(){OpenLayers.Util.removeItem(t.executeCallbacks,r);if(t.chained!==0){t.executeCallbacks.push(r);return}OpenLayers.Request.POST({url:t.client.servers[t.server].url,data:(new OpenLayers.Format.WPSExecute).write(t.description),success:function(r){var i=t.description.processOutputs[n],s=t.findMimeType(i.complexOutput.supported.formats),o=t.formats[s].read(r.responseText);o instanceof OpenLayers.Feature.Vector&&(o=[o]);if(e.success){var u={};u[e.output||"result"]=o,e.success.call(e.scope,u)}},scope:t})}()},scope:this})},output:function(e){return new OpenLayers.WPSProcess.ChainLink({process:this,output:e})},parseDescription:function(e){var t=this.client.servers[this.server];this.description=(new OpenLayers.Format.WPSDescribeProcess).read(t.processDescription[this.identifier]).processDescriptions[this.identifier]},setInputData:function(e,t){delete e.data,delete e.reference;if(t instanceof OpenLayers.WPSProcess.ChainLink)++this.chained,e.reference={method:"POST",href:t.process.server===this.server?this.localWPS:this.client.servers[t.process.server].url},t.process.describe({callback:function(){--this.chained,this.chainProcess(e,t)},scope:this});else{e.data={};var n=e.complexData;if(n){var r=this.findMimeType(n.supported.formats);e.data.complexData={mimeType:r,value:this.formats[r].write(this.toFeatures(t))}}else e.data.literalData={value:t}}},setResponseForm:function(e){e=e||{};var t=this.description.processOutputs[e.outputIndex||0];this.description.responseForm={rawDataOutput:{identifier:t.identifier,mimeType:this.findMimeType(t.complexOutput.supported.formats,e.supportedFormats)}}},getOutputIndex:function(e,t){var n;if(t){for(var r=e.length-1;r>=0;--r)if(e[r].identifier===t){n=r;break}}else n=0;return n},chainProcess:function(e,t){var n=this.getOutputIndex(t.process.description.processOutputs,t.output);e.reference.mimeType=this.findMimeType(e.complexData.supported.formats,t.process.description.processOutputs[n].complexOutput.supported.formats);var r={};r[e.reference.mimeType]=!0,t.process.setResponseForm({outputIndex:n,supportedFormats:r}),e.reference.body=t.process.description;while(this.executeCallbacks.length>0)this.executeCallbacks[0]()},toFeatures:function(e){var t=OpenLayers.Util.isArray(e);t||(e=[e]);var n=new Array(e.length),r;for(var i=0,s=e.length;i<s;++i)r=e[i],n[i]=r instanceof OpenLayers.Feature.Vector?r:new OpenLayers.Feature.Vector(r);return t?n:n[0]},findMimeType:function(e,t){t=t||this.formats;for(var n in e)if(n in t)return n},CLASS_NAME:"OpenLayers.WPSProcess"}),OpenLayers.WPSProcess.ChainLink=OpenLayers.Class({process:null,output:null,initialize:function(e){OpenLayers.Util.extend(this,e)},CLASS_NAME:"OpenLayers.WPSProcess.ChainLink"});