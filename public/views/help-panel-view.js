define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/help-panel.html',
	'text!templates/help/index.html',
	'views/panel-view-base',
], function($, _, Backbone, config, utils, templateHtml, indexHtml, PanelViewBase) {
    "use strict";

	var HelpPanelView = PanelViewBase.extend({

		className: 'panel panel-default extended panel-scrollable panel-center help-panel',
	  	subViewContainer: '.text',

	    events: {
			'click .map-tool.data-library' : 'dataLibraryButtonClicked',
			'click .map-tool.data-import' : 'dataImportButtonClicked',
	    },

	    initialize: function(options) {
		    this.template = _.template(templateHtml);
	    },

	    render: function() 
	    {
			var self = this;
			HelpPanelView.__super__.render.call(this);
			this.getContainer().html(indexHtml);
			return this;
	    },
	    
		dataImportButtonClicked: function(evt)
		{
			app.toggleDataImport();
			evt.preventDefault();
		},

		dataLibraryButtonClicked: function(evt)
		{
			app.toggleDataLibrary();
			evt.preventDefault();
		},

	});

	return HelpPanelView;
});
