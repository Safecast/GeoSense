define([
	'jquery',
	'underscore',
	'backbone',
], function($, _, Backbone) {

	var Parser = function(collection) {
		this.collection = collection;
	};

	Parser.prototype.parse = function(resp, xhr)
	{
		return {
			features: this.collection._super('parse', [resp.features, xhr]),
			extraAttributes: {
				counts: resp.counts || {},
				gridSize: resp.gridSize
			}
		};
	};

	return Parser;

});
