define([
	'jquery',
	'underscore',
	'backbone',
	'models/map_layer',
    'deepextend',
    'deepmodel',
], function($, _, Backbone, MapLayer) {
    "use strict";
    
	var Map = Backbone.DeepModel.extend({
		
		idAttribute: "slug",
		urlRoot: window.BASE_URL + 'api/map',

		adminUri: function(options) 
		{
			return 'admin/' + this.publicUri(options);
		},

		publicUri: function(options)
		{
			var o = options || {};
			return this.attributes.slug 
				+ (o.viewName ? '/' + o.viewName : '');
		},

		adminUrl: function(options) 
		{
			return BASE_URL + this.adminUri(options);
		},

		publicUrl: function(options)
		{
			return BASE_URL + this.publicUri(options);
		},

		newLayerInstance: function(attributes, options) {
			var options = options || {};
			options.parentMap = this;
			return new MapLayer(attributes, options);
		}

	});

	return Map;
});