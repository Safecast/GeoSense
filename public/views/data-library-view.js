define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/data-library.html',
], function($, _, Backbone, config, utils, templateHtml) {
	var DataLibraryView = Backbone.View.extend({

	    tagName: 'div',
		className: 'data-library',
		
	    events: {
			'click #closeDatalibrary' : 'closeButtonClicked',
	    },

	    initialize: function(options) {
		    this.template = _.template(templateHtml);
	    },

	    render: function() {
			var self = this;
			$(this.el).html(this.template());
			
			this.fetchDataCollections();
				
			$(this.el).animate({left: -350}, 1, function()
			{
				$(self.el).css('display','block');	
				$(self.el).animate({
				    left: 0,
				  }, 'fast', 'easeOutCubic', function() {
				  });
			});	
			
			$('body').append('<div class="drop-zone" id="dropZone"><h3 class="instruction">DROP HERE</h3></div>');
			
	        return this;
	    },

		show: function()
		{
			$(this.el).addClass('visible');	
		},

		fetchDataCollections: function() {	
			
			var self = this;	
			$.ajax({
				type: 'GET',
				url: '/api/featurecollections',
				success: function(data) {

					$.each(data, function(key, featureCollection) { 
						self.drawDataSource(featureCollection);
					});
					
					self.$('.data-item').draggable({
						revert: true,
						stack: '#dragLabel',
						start: function(event, ui) { 
							$('#dropZone').addClass('visible');
							$(this).css("opacity",".9");
						},
						stop: function(event, ui) {
							$('#dropZone').removeClass('visible');
						}
					});

					$('#dropZone').droppable( {
				      accept: '.data-item',
				      hoverClass: '',
				      drop: self.dataDrop
				    } );	
				},
				error: function() {
					console.error('failed to fetch collections');
				}
			});
		},
		
		drawDataSource: function(data)
		{
			dataDiv = '<div class="data-item" data-id="'+data._id+'">'
				+'<div class="clearfix"><div class="data-icon"></div><h4 class="data-title">'+data.title+'</h4></div>'
				+(data.count ? '<p class="data-count micro">'+formatLargeNumber(data.count)+'</p>' : '')
				+(data.description ? '<p class="data-description micro">'+data.description+'</p>' : '')
				+(data.source ? '<h5 class="data-source micro">Source: '+data.source+'</p>' : '')
				+'</div>'
			this.$('.data-container').append(dataDiv);
		},
		
		dataDrop: function (event, ui ) {
		  	var draggable = ui.draggable;
			app.saveNewMapLayer(draggable.attr('data-id'));
			$(ui.draggable).css("display","none");
		},
		
		closeButtonClicked: function() {
			this.remove();
		},
		
		remove: function() {
			var self = this;
			$(self.el).animate({
			    left: -350,
			  }, 'fast', 'easeInCubic', function() {
					$('#dropZone').remove();
					app.dataLibraryVisible = false;
					$(window).unbind();
					$(self.el).remove();
					return this;
			  });	
		},
	});

	return DataLibraryView;
});
