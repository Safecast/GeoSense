define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/featurettes.html',
	'views/map-list-view'
], function($, _, Backbone, config, utils, templateHtml, MapListView) {
    "use strict";

	var FeaturettesView = MapListView.extend({

	    initialize: function(options) 
	    {
		    this.template = _.template(templateHtml);
		    this.mapType = 'featured';
		},
	
	});

	return FeaturettesView;
});