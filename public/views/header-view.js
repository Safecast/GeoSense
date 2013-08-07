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
			'click .map-tool.add-data' : 'addDataButtonClicked',
			'click .map-tool.upload' : 'uploadButtonClicked',
			'click .map-tool.timeline' : 'timelineButtonClicked',
			'click #mapView a' : 'mapViewToggleClicked',
			'click #viewBase .dropdown-menu a' : 'viewBaseToggleClicked',
			'click #viewStyle .dropdown-menu a' : 'viewStyleToggleClicked',
			
			'keypress input': 'keyEvent',
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

			this.$('.base-options').click(function(event) {
				event.stopPropagation();
			});

			var opts = this.model.attributes.viewOptions || {},
				opacity = opts.baselayerOpacity || 1,
				backgroundColor = opts.backgroundColor,
				slider = this.$('.baselayer-opacity .slider'),
				input = this.$('input[name=baselayerOpacity]');

			slider.slider({
				min: 0,
				max: 1,
				range: "min",
				step: .025,
				value: opacity,
				slide: function( event, ui ) {
					app.setViewOptions({baselayerOpacity: ui.value});
					input.val(ui.value);
				}
		    });
		    input.val(opacity);
		    input.change(function() {
		    	var val = parseFloat($(this).val());
		    	if (isNaN(val) || val > 1) val = 1;
		    	if (val < 0) val = 0;
		    	$(this).val(val);
		    	slider.slider('value', val);
		    });

			var colorInput = this.$('input[name=backgroundColor]');
	    	if (backgroundColor != undefined) {
				$(colorInput).miniColors('value', backgroundColor);	
	    	}
			$(colorInput).miniColors({
			    change: function(hex, rgb) { 
					app.setViewOptions({backgroundColor: hex});
				}
			});
			$(colorInput).change(function() {
				// when blank
				app.setViewOptions({backgroundColor: $(this).val()});
			});

	        return this;
	    },

		keyEvent: function(event) 
		{		
			if (event.keyCode == 13) {
				if (this.$("#search").is(":focus")) {
					var address = $('#search').val();
					if (address != '') {
						app.zoomToAddress(address);
					}
				}
			}
		},
		
	    populateFromModel: function()
	    {
			var mapInfo = this.model.attributes;
			var title = $('<a>');
			title.text(mapInfo.title);
			title.attr('href', app.genPublicURL());
			title.click(function() {
				console.log(app.getDefaultVisibleMapArea());
				app.mapView.setVisibleMapArea(app.getDefaultVisibleMapArea());
				return false;
			});
			this.$('.brand h1').html(title);

			if (mapInfo.linkURL) {
				this.$('#authorLink').show();
				this.$('#authorLink a').attr('href', mapInfo.linkURL);
				this.$('#authorLink .text').text(mapInfo.linkTitle || mapInfo.title);
			} else {
				this.$('#authorLink').hide();
			}
		},

		mapViewToggleClicked: function(evt)
		{
			var link = evt.currentTarget;
			var mapViewName = link.href.split('#')[1];
			if (mapViewName != app.mapViewName) {
				app.navigate(app.genMapURI(mapViewName), {trigger: true});
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
		
		timelineButtonClicked: function(evt) 
		{
			evt.preventDefault();
		},
		
		setupButtonClicked: function(evt) 
		{
			app.showSetupView();
			evt.preventDefault();
		},

		addDataButtonClicked: function(evt)
		{
			app.toggleDataLibrary();
			evt.preventDefault();
		},

		uploadButtonClicked: function(evt)
		{
			app.toggleDataImport();
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
