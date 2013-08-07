define([
	'jquery',
	'underscore',
	'backbone',
	'models/map',
], function($, _, Backbone, Map) {
    "use strict";

	var GeoFeatureCollections = Backbone.Collection.extend({

		fetchType: null,

		url: function() {
			return window.BASE_URL + 'api/featurecollections' + (this.fetchType ? '/' + this.fetchType : '');
		},

		forType: function(fetchType) {
			this.fetchType = fetchType;
			return this;
		},

		//model: Map
		
	});

	return GeoFeatureCollections;
});