/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Filter=OpenLayers.Class({initialize:function(e){OpenLayers.Util.extend(this,e)},destroy:function(){},evaluate:function(e){return!0},clone:function(){return null},toString:function(){var e;return OpenLayers.Format&&OpenLayers.Format.CQL?e=OpenLayers.Format.CQL.prototype.write(this):e=Object.prototype.toString.call(this),e},CLASS_NAME:"OpenLayers.Filter"});