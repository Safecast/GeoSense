define([
	'jquery',
	'underscore',
	'backbone',
	'models/map_layer',
], function($, _, Backbone, MapLayer) {
    "use strict";
    
	var Map = Backbone.Model.extend({
		
		idAttribute: "publicslug",
		urlRoot: window.BASE_URL + 'api/map',

		publicAdminUrl: function() {
			return BASE_URL + 'admin/' + this.attributes.publicslug;
		},

		newLayerInstance: function(attributes, options) {
			var options = options || {};
			options.parentMap = this;
			return new MapLayer(attributes, options);
		}

	});

	return Map;
});