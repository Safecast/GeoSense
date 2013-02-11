define([
	'jquery',
	'underscore',
	'backbone',
], function($, _, Backbone) {
	var Map = Backbone.Model.extend({
		
		idAttribute: "_id",
		urlRoot: '/api/map',

		url: function() {
			return this.urlRoot + '/' + this.attributes.publicslug;
		}

	});

	return Map;
});