define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/header.html',
], function($, _, Backbone, config, utils, templateHtml) {
    "use strict";

	var HeaderView = Backbone.View.extend({

	    tagName: 'div',
		className: 'header-view',
		
	    events: {
			'click #aboutMap': 'aboutMapClicked',
			'click #aboutGeoSense' : 'aboutGeoSenseClicked',
			'click #shareLink' : 'shareLinkClicked',
			'click #postFacebook' : 'postFacebookClicked',
			'click #postTwitter' : 'postTwitterClicked',
			'click .map-tool.setup' : 'setupButtonClicked',
			'click .map-tool.data-library' : 'dataLibraryButtonClicked',
			'click .map-tool.data-import' : 'dataImportButtonClicked',
			'click .map-tool.timeline' : 'timelineButtonClicked',
			'click #mapView a' : 'mapViewToggleClicked',
			'click #viewBase .dropdown-menu a' : 'viewBaseToggleClicked',
			'click .view-style a' : 'viewStyleToggleClicked',
			'click #customizeViewOptions': 'customizeViewOptionsClicked',
			'click .search-form button': 'searchClicked'
	    },

	    initialize: function(options) 
	    {
		    this.template = _.template(templateHtml);
			this.vent = options.vent;	
			this.listenTo(this.model, 'sync', this.populateFromModel);
	    },

	    render: function() 
	    {
			$(this.el).html(this.template());
			this.populateFromModel();
			
			this.$('.search-query').click(function() {
				$(this).select();
			});

			if (!app.isMapAdmin()) {
				this.$('.admin-tool').remove();
			} 

			var user = app.currentUser();
			if (user) {
				this.$('.user-name').text(user.email);
				this.$('.logged-out').addClass('hidden');
			} else {
				this.$('.logged-in').addClass('hidden');
			}

			this.$('.nav').each(function() {
				if ($('li, button', this).length == 0) {
					$(this).remove();
				}
			});

	        return this;
	    },

		searchClicked: function(event)
		{
			var address = this.$('.search-query').val();
			if (address != '') {
				app.zoomToAddress(address);
			}
			return false;
		},
		
	    populateFromModel: function()
	    {
			var appTitle = this.$('.app-title');
			appTitle.attr('href', window.BASE_URL);

			var mapInfo = this.model.attributes;
			var title = this.$('.map-title');
			title.text(mapInfo.title);
			title.attr('href', app.genPublicURL());
			title.click(function() {
				app.navigate(app.map.publicUri(), {trigger: true});
				return false;
			});

			if (mapInfo.linkURL) {
				this.$('#authorLink').show();
				this.$('#authorLink a').attr('href', mapInfo.linkURL);
				this.$('#authorLink .text').text(mapInfo.linkTitle || mapInfo.title);
			} else {
				this.$('#authorLink').hide();
			}

			this.$('a.admin-map')
				.attr('href', this.model.adminUrl())
				.toggleClass('hidden', app.isMapAdmin());
			this.$('a.public-map')
				.attr('href', this.model.publicUrl())
				.toggleClass('hidden', !app.isMapAdmin());
		},

		mapViewToggleClicked: function(evt)
		{
			var link = evt.currentTarget;
			var mapViewName = link.href.split('#')[1];
			if (mapViewName != app.mapViewName) {
				app.navigate(app.map.publicUri({viewName: mapViewName}), {trigger: true});
			}
			evt.preventDefault();
		},

		viewBaseToggleClicked: function(evt)
		{
			var link = evt.currentTarget;
			var viewBase = link.href.split('#')[1];
			app.setViewBase(viewBase);
			evt.preventDefault();
		},

		viewStyleToggleClicked: function(evt)
		{
			var link = evt.currentTarget;
			var style = link.href.split('#')[1];
			app.setViewStyle(style);
			evt.preventDefault();
		},

		customizeViewOptionsClicked: function(evt)
		{
			app.showBaselayerEditor();
			evt.preventDefault();
		},
		
		timelineButtonClicked: function(evt) 
		{
			evt.preventDefault();
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

		aboutGeoSenseClicked: function(evt) 
		{	
			app.showAbout();
			evt.preventDefault();
		},
		
		aboutMapClicked: function(evt) 
		{
			app.showMapInfo();
			evt.preventDefault();
		},
		
		shareLinkClicked: function(evt)
		{
			app.showShareLink();
			evt.preventDefault();
		},

		postTwitterClicked: function(evt) 
		{
			var mapInfo = this.model.attributes,
				tweet = {},
				url = app.genPublicURL(true);
			tweet.url = url;
			tweet.text = __('Check out the %(title)s map:', {
				url: url,
				title: mapInfo.title
			});
			if (mapInfo.twitter) {
				tweet.via = mapInfo.twitter;
			}

			var url = 'https://twitter.com/share?' + $.param(tweet);
			window.open(url, __('Tweet this post'), 'width=650,height=251,toolbar=0,scrollbars=0,status=0,resizable=0,location=0,menuBar=0');
			evt.preventDefault();
		},
		
		postFacebookClicked: function(evt) 
		{
			var mapInfo = this.model.attributes,
				url = 'http://www.facebook.com/sharer.php?u='
			url += encodeURIComponent(app.genPublicURL(true));
			url += '&t=' +encodeURIComponent(__('Check out the %(title)s map', {
				title: mapInfo.title
			}));
			window.open('' + url, __('Share it on Facebook'), 'width=650,height=251,toolbar=0,scrollbars=0,status=0,resizable=0,location=0,menuBar=0');
			evt.preventDefault();
		},
		
		remove: function() 
		{
			$(window).unbind();
			$(this.el).remove();
			return this;
		},
	  
	});

	return HeaderView;
});
