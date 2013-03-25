define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/map-ge.html',
	'views/map-view-base'
], function($, _, Backbone, config, utils, templateHtml, MapViewBase) {
    "use strict";

	var MapGEView = MapViewBase.extend({

	    tagName: 'div',
		className: 'map-view',

		addFeatures: {
		},
		
	    initialize: function(options) {
			MapGEView.__super__.initialize.call(this, options);
		    this.template = _.template(templateHtml);
		
			/*
			_.bindAll(this, "updateViewStyle");
		 	options.vent.bind("updateViewStyle", this.updateViewStyle);
		
			Feature = OpenLayers.Feature.Vector;
			Geometry = OpenLayers.Geometry;
			Rule = OpenLayers.Rule;
			Filter = OpenLayers.Filter;
			
			previousKey = 0;
			scope = this;
			OpenLayers.ImgPath = "/assets/openlayers-light/";	
			*/
	    },

	    render: function() {
			$(this.el).html(this.template());				
	        return this;
	    },

		getVisibleMapArea: function() {
		},

		start: function(viewStyle) {
			var self = this;
								        
		},
		
	});

	return MapGEView;
});
