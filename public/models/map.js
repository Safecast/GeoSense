define([
	'jquery',
	'underscore',
	'backbone',
	'models/map_layer',
], function($, _, Backbone, MapLayer) {
	var Map = Backbone.Model.extend({
		
		idAttribute: "_id",
		urlRoot: (window.BASE_URL || '/') + 'api/map',

		url: function() {
			return this.urlRoot + '/' + this.attributes.publicslug;
		},

		newLayerInstance: function(attributes, options) {
			var options = options || {};
			options.parentMap = this;
			return new MapLayer(attributes, options);
		}

	});

	return Map;
});