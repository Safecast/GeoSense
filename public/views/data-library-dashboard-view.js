define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/data-library-dashboard.html',
	'views/data-library-view'
], function($, _, Backbone, config, utils, templateHtml, DataLibraryView) {
    "use strict";

	var DataLibraryDashboardView = DataLibraryView.extend({

		className: 'layers-panel data-library',
	  	scrollableContainer: window,

	    initialize: function(options) {
	    	DataLibraryDashboardView.__super__.initialize.apply(this, arguments);
		    this.template = _.template(templateHtml);
	    },

	});

	return DataLibraryDashboardView;

});