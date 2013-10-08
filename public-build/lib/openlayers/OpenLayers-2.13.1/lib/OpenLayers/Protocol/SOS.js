/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Protocol.SOS=function(e){e=OpenLayers.Util.applyDefaults(e,OpenLayers.Protocol.SOS.DEFAULTS);var t=OpenLayers.Protocol.SOS["v"+e.version.replace(/\./g,"_")];if(!t)throw"Unsupported SOS version: "+e.version;return new t(e)},OpenLayers.Protocol.SOS.DEFAULTS={version:"1.0.0"};