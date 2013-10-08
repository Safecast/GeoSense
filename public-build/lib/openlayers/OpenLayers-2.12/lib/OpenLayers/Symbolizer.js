/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Symbolizer=OpenLayers.Class({zIndex:0,initialize:function(e){OpenLayers.Util.extend(this,e)},clone:function(){var Type=eval(this.CLASS_NAME);return new Type(OpenLayers.Util.extend({},this))},CLASS_NAME:"OpenLayers.Symbolizer"});