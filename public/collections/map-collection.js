define([
	'jquery',
	'underscore',
	'backbone',
	'models/map',
], function($, _, Backbone, Map) {
    "use strict";

	var MapCollection = Backbone.Collection.extend({

		mapType: null,

		url: function() {
			return window.BASE_URL + 'api/maps' + (this.mapType ? '/' + this.mapType : '');
		},

		forType: function(mapType) {
			this.mapType = mapType;
			return this;
		},

		model: Map
		
	});

	return MapCollection;
});