define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/user-maps.html',
	'views/map-list-view'
], function($, _, Backbone, config, utils, templateHtml, MapListView) {
    "use strict";

	var UserMapsView = MapListView.extend({

	    initialize: function(options) 
	    {
		    this.template = _.template(templateHtml);
		    this.mapType = 'user';
		},
	
	});

	return UserMapsView;
});