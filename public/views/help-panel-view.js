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
			'click .map-tool.setup' : 'setupButtonClicked',
			'click .map-tool.data-library' : 'dataLibraryButtonClicked',
			'click .map-tool.data-import' : 'dataImportButtonClicked',
	    },

	    initialize: function(options) 
	    {
	    	var self = this;
	    	this.mapWasSaved = false;
		    this.template = _.template(templateHtml);
		    this.listenTo(app.setupView, 'map:saved', function(model) {
		    	self.mapWasSaved = true;
		    	self.updateButtonStates();
		    });
	    },

	    updateButtonStates: function()
	    {
	    	var self = this;
			this.$('.map-tool.email .glyphicon-ok').toggle(this.hasEmail());
			this.$('.map-tool.info .glyphicon-ok').toggle(this.hasDescription() && this.hasEmail());
	    	if (self.hasEmail()) {
		    	self.$('.step-email button')
		    		.removeClass('btn-danger')
		    		.addClass('btn-primary');
		    	if (self.$('.step-setup').is(':visible') || !self.$el.is(':visible')) {
			    	self.$('.step-email').hide();
		    	}
	    	} else {
		    	self.$('.step-setup').toggle(!self.mapWasSaved);
		    	self.$('.step-email').toggle(self.mapWasSaved);
	    	}
	    },

	    hasEmail: function() 
	    {
	    	return app.map.attributes.createdBy 
	    		&& app.map.attributes.createdBy.email 
	    		&& app.map.attributes.createdBy.email != '' ? true : false;
	    },

	    hasDescription: function() 
	    {
	    	return app.map.attributes.description 
	    		&& app.map.attributes.description != '' ? true : false;
	    },

	    render: function() 
	    {
			var self = this;
			HelpPanelView.__super__.render.call(this);
			this.getContainer().html(indexHtml);
			this.updateButtonStates();
			return this;
	    },

		setupButtonClicked: function(evt)
		{
			app.showSetupView();
			evt.preventDefault();
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
