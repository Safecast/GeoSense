define([
	'jquery',
	'underscore',
	'backbone',
], function($, _, Backbone) {
	var Map = Backbone.Model.extend({
		
		idAttribute: "_id"

	});

	return Map;
});