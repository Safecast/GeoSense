define(["jquery","underscore","backbone","models/geo-feature"],function(e,t,n,r){var i=n.Collection.extend({model:r,initialize:function(e,t){this.mapLayer=t.mapLayer},url:function(){return BASE_URL+"api/featurecollection/"+this.mapLayer.attributes.featureCollection._id+"/histogram"},parse:function(e,t){return this.properties=e.properties,e.items}});return i});