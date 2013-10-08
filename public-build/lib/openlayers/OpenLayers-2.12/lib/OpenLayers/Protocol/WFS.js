/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Protocol.WFS=function(e){e=OpenLayers.Util.applyDefaults(e,OpenLayers.Protocol.WFS.DEFAULTS);var t=OpenLayers.Protocol.WFS["v"+e.version.replace(/\./g,"_")];if(!t)throw"Unsupported WFS version: "+e.version;return new t(e)},OpenLayers.Protocol.WFS.fromWMSLayer=function(e,t){var n,r,i=e.params.LAYERS,s=(OpenLayers.Util.isArray(i)?i[0]:i).split(":");s.length>1&&(r=s[0]),n=s.pop();var o={url:e.url,featureType:n,featurePrefix:r,srsName:e.projection&&e.projection.getCode()||e.map&&e.map.getProjectionObject().getCode(),version:"1.1.0"};return new OpenLayers.Protocol.WFS(OpenLayers.Util.applyDefaults(t,o))},OpenLayers.Protocol.WFS.DEFAULTS={version:"1.0.0"};