define([
	'jquery',
	'underscore',
	'backbone',
	'models/map',
], function($, _, Backbone, Map) {
    "use strict";

	var Maps = Backbone.Collection.extend({

		fetchType: null,

		url: function() {
			return window.BASE_URL + 'api/maps' + (this.fetchType ? '/' + this.fetchType : '');
		},

		forType: function(fetchType) {
			this.fetchType = fetchType;
			return this;
		},

		model: Map
		
	});

	return Maps;
});