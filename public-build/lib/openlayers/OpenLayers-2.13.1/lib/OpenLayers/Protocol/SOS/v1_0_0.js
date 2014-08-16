/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Protocol.SOS.v1_0_0=OpenLayers.Class(OpenLayers.Protocol,{fois:null,formatOptions:null,initialize:function(e){OpenLayers.Protocol.prototype.initialize.apply(this,[e]),e.format||(this.format=new OpenLayers.Format.SOSGetFeatureOfInterest(this.formatOptions))},destroy:function(){this.options&&!this.options.format&&this.format.destroy(),this.format=null,OpenLayers.Protocol.prototype.destroy.apply(this)},read:function(e){e=OpenLayers.Util.extend({},e),OpenLayers.Util.applyDefaults(e,this.options||{});var t=new OpenLayers.Protocol.Response({requestType:"read"}),n=this.format,r=OpenLayers.Format.XML.prototype.write.apply(n,[n.writeNode("sos:GetFeatureOfInterest",{fois:this.fois})]);return t.priv=OpenLayers.Request.POST({url:e.url,callback:this.createCallback(this.handleRead,t,e),data:r}),t},handleRead:function(e,t){if(t.callback){var n=e.priv;n.status>=200&&n.status<300?(e.features=this.parseFeatures(n),e.code=OpenLayers.Protocol.Response.SUCCESS):e.code=OpenLayers.Protocol.Response.FAILURE,t.callback.call(t.scope,e)}},parseFeatures:function(e){var t=e.responseXML;if(!t||!t.documentElement)t=e.responseText;return!t||t.length<=0?null:this.format.read(t)},CLASS_NAME:"OpenLayers.Protocol.SOS.v1_0_0"});