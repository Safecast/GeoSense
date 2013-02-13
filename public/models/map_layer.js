define([
	'jquery',
	'underscore',
	'backbone',
	'deepextend',
	'deepmodel'
], function($, _, Backbone) {
	var MapLayer = Backbone.DeepModel.extend({
		
		idAttribute: "_id",
		
		urlRoot: function() 
		{
			return this.map.url() + '/layer';
		},

	    initialize: function(attributes, options) 
	    {
	        this.map = options.map;
	        this.pointCollection = options.pointCollection;
	    },

	    getNormalizedColors: function(originalColors) 
	    {
	    	var self = this,
	    		originalColors = originalColors || this.attributes.layerOptions.colors;
	    	return originalColors.map(function(c) {
	    		var p = parseFloat(c.position),
	    			p = isNaN(p) ? 1 : p,
	    			sc = (c.position || '') + '';
	    		return _.extend({}, c, {
	    			position: sc[sc.length - 1] == '%' ?
	    				p / 100 : (p - self.attributes.pointCollection.minVal) / (self.attributes.pointCollection.maxVal - self.attributes.pointCollection.minVal)
	    		});
	    	});
	    }
	});

	return MapLayer;
});