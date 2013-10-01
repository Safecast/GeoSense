define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'permissions',
	'text!templates/help-panel.html',
	'text!templates/help/index.html',
	'views/panel-view-base',
], function($, _, Backbone, config, utils, permissions, templateHtml, indexHtml, PanelViewBase) {
    "use strict";

	var HelpPanelView = PanelViewBase.extend({

		className: 'panel panel-default extended panel-scrollable panel-center help-panel',
	  	subViewContainer: '.text',

	    events: {
			'click .map-tool.signup' : 'signupButtonClicked',
			'click .map-tool.setup' : 'setupButtonClicked',
			'click .map-tool.data-library' : 'dataLibraryButtonClicked',
			'click .map-tool.data-import' : 'dataImportButtonClicked',
			'click .map-tool.sharing' : 'sharingButtonClicked',
	    },

	    initialize: function(options) 
	    {
	    	var self = this;
		    this.template = _.template(templateHtml);
		    this.listenTo(app.setupView, 'map:saved', function(model) {
		    	self.updateButtonStates();
		    });
		    this.listenTo(app, 'user:login', function(model) {
		    	self.updateButtonStates();
		    });
		    this.listenTo(app, 'layer:added', function(model) {
		    	self.updateButtonStates();
		    });
	    },

	    updateButtonStates: function()
	    {
	    	var self = this;

			this.$('.map-tool.signup .glyphicon-ok').toggle(this.hasUserAccount());
			this.$('.map-tool.info .glyphicon-ok').toggle(this.hasDescription() && this.hasUserAccount());
	    	this.$('.map-tool.data-import').attr('disabled', !self.hasUserAccount());
			this.$('.map-tool.sharing .glyphicon-ok').toggle(!app.map.isPrivate());

			this.$('.map-tool.data-import .glyphicon-ok').hide();
			this.$('.map-tool.data-library .glyphicon-ok').hide();
			_.each(app.mapLayersById, function(layer) {
				if (permissions.canAdminModel(layer.featureCollection)) {
					self.$('.map-tool.data-import .glyphicon-ok').show();
				} else {
					self.$('.map-tool.data-library .glyphicon-ok').show();
				}
			});

	    	if (self.hasUserAccount()) {
		    	self.$('.step-signup button')
		    		.removeClass('btn-danger')
		    		.addClass('btn-primary');
		    	if (self.$('.step-setup').is(':visible') || !self.$el.is(':visible')) {
			    	self.$('.step-signup').hide();
		    	}
	    	} else {
		    	self.$('.step-setup').toggle(!this.hasDescription());
		    	self.$('.step-signup').toggle(this.hasDescription());
	    	}
	    },

	    hasUserAccount: function() 
	    {
	    	return permissions.canAdminModel(app.map);
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

		signupButtonClicked: function(evt)
		{
			app.showSignup();
			evt.preventDefault();
		},

		setupButtonClicked: function(evt)
		{
			app.showSetupView('#tab-setup-info');
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

		sharingButtonClicked: function(evt)
		{
			app.showSetupView('#tab-setup-sharing');
			evt.preventDefault();
		},

	});

	return HelpPanelView;
});
