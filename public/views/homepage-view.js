define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/homepage.html',
	'models/map',
	'collections/maps'
], function($, _, Backbone, config, utils, templateHtml, Map, Maps) {
    "use strict";

	var HomepageView = Backbone.View.extend({

	    tagName: 'div',
		className: 'homepage',
		
	    events: {
			'click #createMap': 'createMapButtonClicked',
			'click #nextMapSet' : 'nextMapSetClicked',
	    },

	    initialize: function(options) {
		    this.template = _.template(templateHtml);
			this.fetchFeaturedMaps();
			this.featuredMaps = [];
			this.featuredMapSet = 0;
			this.numberOfMapsDisplay = 5;
		},

	    render: function() {
			$(this.el).html(this.template());
			this.$('.alert').hide();
			this.$('.map-title').focus();
	        return this;
	    },

		fetchFeaturedMaps: function() {
			var self = this;
			new Maps().forType('featured').fetch({
				success: function(collection, response, options) {
					collection.each(function(model) {
						var url = genMapURL(model.attributes);
						self.featuredMaps.push('<tr><td>' + model.attributes.title + '</td><td><a target="_self" href="' + url + '">' + url + '</a></td><tr>');
					});
					app.setUIReady();
					self.showRecentMaps();
				},
				error: function(collection, response, options) {
					app.setUIReady();
					console.error('failed to fetch unique map');
				}
			});
		},
		
		showRecentMaps: function()
		{
			if((this.featuredMapSet + this.numberOfMapsDisplay) >= this.featuredMaps.length)
			{
				this.$('#nextMapSet').fadeOut('fast');
			}
			
			var self = this;
			self.$('#mapTable').fadeOut('fast',function(){
				self.$('#mapTable').empty();
				for(var i = self.featuredMapSet;i<(self.numberOfMapsDisplay + self.featuredMapSet);i++)
				{
					self.$('#mapTable').append(self.featuredMaps[i]);
				}
				self.$('#mapTable').fadeIn('fast');
			});	
		},
		
		nextMapSetClicked: function()
		{
			this.featuredMapSet+=this.numberOfMapsDisplay;
			this.showRecentMaps();
		},

		createMapButtonClicked: function() {
			var self = this;

			var postData = {
				title: this.$('.map-title').val()
			};

			if (!postData.title || postData.title == '') {	
				this.$('#errorMessage').show();
				this.$('.map-title').focus();
			} else {
				console.log('creating map', postData);
				new Map().save(postData, {
					success: function(model, response, options) {
						console.log('new map created');
						window.location.href = model.publicAdminUrl();
					},
					error: function(model, xhr, options) {
						console.error('failed to create a new map');
					}
				});
			}
			return false;
		}
	});

	return HomepageView;
});