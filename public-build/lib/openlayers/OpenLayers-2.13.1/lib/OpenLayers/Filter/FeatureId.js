/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Filter.FeatureId=OpenLayers.Class(OpenLayers.Filter,{fids:null,type:"FID",initialize:function(e){this.fids=[],OpenLayers.Filter.prototype.initialize.apply(this,[e])},evaluate:function(e){for(var t=0,n=this.fids.length;t<n;t++){var r=e.fid||e.id;if(r==this.fids[t])return!0}return!1},clone:function(){var e=new OpenLayers.Filter.FeatureId;return OpenLayers.Util.extend(e,this),e.fids=this.fids.slice(),e},CLASS_NAME:"OpenLayers.Filter.FeatureId"});