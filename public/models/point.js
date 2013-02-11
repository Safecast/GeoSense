define([
	'jquery',
	'underscore',
	'backbone',
], function($, _, Backbone) {
	var Point = Backbone.Model.extend({
		
		idAttribute: "_id",
		
		defaults: function() {
		      return {
				datetime: Date,
		        loc: [0,0],
				val: null,
		    };
		},
	});

	return Point;
});