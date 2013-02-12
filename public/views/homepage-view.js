define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/homepage.html',
], function($, _, Backbone, config, utils, templateHtml) {
	var HomepageView = Backbone.View.extend({

	    tagName: 'div',
		className: 'homepage-view',
		
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
	        return this;
	    },

		fetchFeaturedMaps: function() {
			var self = this;
			$.ajax({
				type: 'GET',
				url: '/api/maps/featured',
				success: function(data) {
					for (i = 0; i < data.length; i++) {
						var url = genMapURL(data[i]);
						self.featuredMaps.push('<tr><td>' + data[i].title + '</td><td><a target="_self" href="' + url + '">' + url + '</a></td><tr>');
					}
					app.setUIReady();
					self.showRecentMaps();
				},
				error: function() {
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
				for(i=self.featuredMapSet;i<(self.numberOfMapsDisplay + self.featuredMapSet);i++)
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
				title: this.$('#appendedPrependedInput').val()
			};

			if (!postData.title || postData.title == '') {	
				this.$('#errorMessage').show();
			} else {
				console.log('creating map', postData);
				$.ajax({
					type: 'POST',
					url: '/api/map',
					data: postData,
					success: function(data) {
						window.location.href = '/admin/' + data.publicslug+'/setup';
					},
					error: function() {
						console.error('failed to create a new map');
					}
				});
			}
		}
	});

	return HomepageView;
});