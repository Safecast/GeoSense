define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/data-library.html',
	'models/map_layer',
	'views/panel-view-base',
	'views/map-layer-view',
	'collections/geo-feature-collections'
], function($, _, Backbone, config, utils, templateHtml, MapLayer, PanelViewBase, MapLayerView, GeoFeatureCollections) {
    "use strict";

	var DataLibraryView = PanelViewBase.extend({

		className: 'panel panel-default panel-stick-left panel-scrollable layers-panel data-library',
		draggable: false,

	    events: {
			'submit form.search, keypress form.search .search-query': 'searchClicked',
			'click button.remove-query': 'removeQueryClicked',
			'click button.add-layer': 'addLayerButtonClicked'
	    },

	  	subViewContainer: '.collections-list',
	    prevQuery: '',
	    dataCollectionsFetched: false,
	    hasSearchQuery: false,

	    initialize: function(options) {
		    this.template = _.template(templateHtml);
		    this.collection = new GeoFeatureCollections();
		    this.listenTo(this.collection, 'reset', this.featureCollectionReset);
	    },

	    render: function() 
	    {
			var self = this;
			DataLibraryView.__super__.render.call(this);
			this.on('panel:show', function() {
		    	this.$(this.subViewContainer).empty();
				setTimeout(function() {
					if (!self.hasSearchQuery) {
						self.fetchDataCollections();
					}
				}, 250); // wait for slide
				self.$('.search-query').trigger('click');
			});
			this.dropZone = $('<div class="drop-zone" id="dropZone"><h3 class="instruction">DROP HERE</h3></div>');
			$('body').append(this.dropZone);
			this.$('form.search .search-query').on('click', function() {
				$(this).select();
			});
			this.$('form.search .search-query').keyup(function() {
				//self.searchClicked();
			});
	    	this.$('button.remove-query').hide();
	        return this;
	    },

	    searchClicked: function(event)
	    {
	    	var query = this.$('.search-query').val();
	    	this.$('button.remove-query').toggle(query != '');
	    	if (true/*this.prevQuery != query*/) {
		    	this.fetchDataCollections({q: query});
		    	this.prevQuery = query;
		    	this.hasSearchQuery = query != '';
	    	}
	    	return false;
	    },

	    removeQueryClicked: function(event)
	    {
	    	console.log('remove');
	    	this.$('.search-query').val('');
	    },

	    featureCollectionReset: function(collection) 
	    {
	    	this.$(this.subViewContainer).empty();
	    	var self = this;
	    	this.$('form.search .help-block').text(
	    		collection.length == 1 ?  
	    		__('%(num)s collection found', {num: collection.length})
	    		: __('%(num)s collections found', {num: collection.length})
	    	);
			collection.each(function(model, index) { 
				var mapLayer = new MapLayer({
						featureCollection: model.attributes,
						layerOptions: model.attributes.defaults
					}),
	            	mapLayerView = new MapLayerView({model: mapLayer});
            	mapLayerView.expandContent = false;
            	mapLayerView.expandLayerDetails = true;
            	mapLayerView.legendViewOptions.autoHide = false;
	            self.appendSubView(mapLayerView.render());
	            mapLayerView.$el.hide().slideDown('fast');
			});
			
			self.$('.map-layer').draggable({
				revert: 'invalid',
				stack: this.dropZone,
				start: function(event, ui) { 
					self.dropZone.addClass('visible');
					self.dropZone.css('left', self.$el.outerWidth() + 'px');
					ui.helper.css('width', $(this).outerWidth() + 'px');
					ui.helper.addClass('drag-helper');
				},
				helper: 'clone',
				appendTo: self.$el,
				stop: function(event, ui) {
					self.dropZone.removeClass('visible');
				}
			});

			this.dropZone.droppable( {
		    	accept: '.map-layer',
		    	hoverClass: '',
		    	drop: self.dataDrop
		    } );	
	    },

		fetchDataCollections: function(params) {	
			var self = this;	
			this.dataCollectionsFetched = true;
			this.$('form.search .help-block').text(__('loading…'));
			this.collection.fetch({
				data: params,
				success: function(collection, response, options) {
				},
				error: function(collection, response, options) {
					console.error('failed to fetch collections');
				}
			});
		},
		
		dataDrop: function(event, ui ) {
		  	var id = ui.draggable.attr('data-feature-collection-id');
			app.saveNewMapLayer(id);
		},

		addLayerButtonClicked: function(event)
		{
			var id = $(event.currentTarget).closest('.map-layer').attr('data-feature-collection-id');
			app.saveNewMapLayer(id);
			return false;
		},
		
	});

	return DataLibraryView;
});
