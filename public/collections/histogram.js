define([
	'jquery',
	'underscore',
	'backbone',
	'models/geo-feature',
], function($, _, Backbone, GeoFeature) {
    "use strict";

	var Histogram = Backbone.Collection.extend({

		model: GeoFeature,

		initialize: function(models, options) 
		{
			this.mapLayer = options.mapLayer;
		},

		url: function() {
			return window.BASE_URL + 'api/featurecollection/' 
                + this.mapLayer.attributes.featureCollection._id
                + '/histogram';
		},
	
	});

	return Histogram;
});