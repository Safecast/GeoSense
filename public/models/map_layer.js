define([
	'jquery',
	'underscore',
	'backbone',
	'deepextend',
	'deepmodel'
], function($, _, Backbone) {
	var MapLayer = Backbone.DeepModel.extend({
		
		idAttribute: "_id",
		
		urlRoot: function() {
			return this.map.url() + '/layer';
		},

	    initialize: function(attributes, options) {
	        this.map = options.map;
	        this.pointCollection = options.pointCollection;
	    },

	    getNormalizedColors: function(originalColors) {
	    	var colors = [],
	    		originalColors = originalColors || this.attributes.options.colors;
	    	for (var i = 0; i < originalColors.length; i++) {
	    		var c = originalColors[i],
	    			p = parseFloat(c.position),
	    			sc = (c.position || '') + '';
	    		if (isNaN(p)) {
	    			p = 1;
	    		}
	    		colors[i] = _.extend({}, c, {
	    			position: sc[sc.length - 1] == '%' ?
	    				p / 100 : (p - this.attributes.pointCollection.minVal) / (this.attributes.pointCollection.maxVal - this.attributes.pointCollection.minVal)
	    		});
	    	}
	    	return colors;
	    }
	});

	return MapLayer;
});