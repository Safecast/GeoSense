/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Format.CSWGetDomain=function(e){e=OpenLayers.Util.applyDefaults(e,OpenLayers.Format.CSWGetDomain.DEFAULTS);var t=OpenLayers.Format.CSWGetDomain["v"+e.version.replace(/\./g,"_")];if(!t)throw"Unsupported CSWGetDomain version: "+e.version;return new t(e)},OpenLayers.Format.CSWGetDomain.DEFAULTS={version:"2.0.2"};