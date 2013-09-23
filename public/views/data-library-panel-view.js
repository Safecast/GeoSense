define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/data-library.html',
	'views/data-library-view'
], function($, _, Backbone, config, utils, templateHtml, DataLibraryView) {
    "use strict";

	var DataLibraryPanelView = DataLibraryView.extend({

		className: 'panel panel-default panel-anchor-left panel-scrollable layers-panel data-library',
		draggable: false,

	    events: {
			'submit form.search, keypress form.search .search-query': 'searchClicked',
			'click button.remove-query': 'removeQueryClicked',
			'click button.add-layer': 'addLayerButtonClicked'
	    },

	    initialize: function(options) {
	    	DataLibraryPanelView.__super__.initialize.apply(this, arguments);
		    this.template = _.template(templateHtml);
	    },

	    render: function() 
	    {
			var self = this;
			DataLibraryPanelView.__super__.render.call(this);
			this.on('panel:shown', function() {
				setTimeout(function() {
					if (!self.searchParams.q || self.searchParams.q == '') {
				    	self.resetPageParams();
				    	self.$(self.subViewContainer).empty();
						self.fetchResults(self.searchParams);
					}
				}, 250); // wait for slide
				self.$('.search-query').focus();
			});

			$(window).on('resize', function() {
				if (self.isLoading) return;
				var l = self.detectPageLimit();
				if (!self.isLastPage && self.numResults() < l) {
					self.searchParams.l = l;
					self.fetchResults(self.searchParams);
				}
			});

			this.$dropZone = self.$('.drop-zone').remove();

	        return this;
	    },

		dataDrop: function(event, ui ) 
		{
		  	var id = ui.draggable.attr('data-feature-collection-id');
			app.saveNewMapLayer(id);
		},

		addLayerButtonClicked: function(event)
		{
			var id = $(event.currentTarget).closest('.map-layer').attr('data-feature-collection-id');
			app.saveNewMapLayer(id);
			return false;
		},

	    mapLayerViewPostRender: function(mapLayerView)
	    {
	    	var self = this;
			mapLayerView.$el.draggable({
				revert: 'invalid',
				stack: self.$dropZone,
				start: function(event, ui) { 
					self.$dropZone
						.css({'left': self.$el.outerWidth() + 'px', 'z-index': 999})
						.droppable( {
					    	accept: '.map-layer',
					    	hoverClass: 'hover',
					    	drop: self.dataDrop
					    });
					$('#main-viewport').append(self.$dropZone);
					self.$dropZone.addClass('visible');
					ui.helper.css('width', $(this).outerWidth() + 'px');
					ui.helper.addClass('drag-helper');
				},
				helper: 'clone',
				appendTo: self.$el,
				stop: function(event, ui) {
					self.$dropZone.removeClass('visible').remove();
				}
			});
	    },
		
	});

	return DataLibraryPanelView;
});
