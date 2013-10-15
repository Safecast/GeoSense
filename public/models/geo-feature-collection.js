define([
	'jquery',
	'underscore',
	'backbone'
], function($, _, Backbone) {
    "use strict";
    
	var GeoFeatureCollection = Backbone.Model.extend({
		
		idAttribute: "_id",
		urlRoot: BASE_URL + 'api/featurecollection',

	});

	return GeoFeatureCollection;
});