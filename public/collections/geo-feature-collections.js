define([
	'jquery',
	'underscore',
	'backbone',
	'models/map-layer',
], function($, _, Backbone, MapLayer) {
    "use strict";

	var GeoFeatureCollections = Backbone.Collection.extend({

		url: function() {
			return BASE_URL + 'api/featurecollections' + (this.fetchType ? '/' + this.fetchType : '');
		},

		forType: function(fetchType) {
			this.fetchType = fetchType;
			return this;
		},

	});

	return GeoFeatureCollections;
});