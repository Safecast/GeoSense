define([
	'jquery',
	'underscore',
	'backbone',
	'models/map_layer',
], function($, _, Backbone, MapLayer) {
    "use strict";

	var GeoFeatureCollections = Backbone.Collection.extend({

		//model: MapLayer,
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