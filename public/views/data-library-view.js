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
	'mixins/spinner-mixin',
	'collections/geo-feature-collections'
], function($, _, Backbone, config, utils, templateHtml, MapLayer, PanelViewBase, MapLayerView, SpinnerMixin, GeoFeatureCollections) {
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

	    initialize: function(options) {
		    this.template = _.template(templateHtml);
		    this.collection = new GeoFeatureCollections();
		    this.lastPage = true;
		    this.searchParams = {p: 0};
		    this.resultHeight = 30;
	    },

	    detectPageLimit: function()
	    {
	    	console.log(this.$scrollable, this.$scrollable.height());
			return Math.ceil(this.$scrollable.height() / this.resultHeight / 10) * 10;
	    },

	    resetPageParams: function()
	    {
	    	this.isLastPage = false;
	    	this.searchParams.p = 0;
			this.searchParams.l = this.detectPageLimit();
	    },

	    updateAfterScrolled: function(evt)
	    {
	    	var delta = this.$scrollable.scrollTop() 
	    		+ this.$scrollable.height() - this.$scrollContent.height();
	    	if (delta > -50) {
    			this.loadNextPage();
	    	}
	    },

	    loadNextPage: function(event) 
	    {
	    	if (this.isLoading || this.isLastPage) return;
	    	var self = this;
	    	this.searchParams.p++;
	    	console.log('loadNextPage', this.searchParams);
	    	this.fetchResults(this.searchParams, function(collection, response, options) {
	    		self.updateFeatureCollectionList(false);
	    	});
	    },

	    render: function() 
	    {
			var self = this;
			DataLibraryView.__super__.render.call(this);
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

			this.dropZone = $('<div class="drop-zone" id="dropZone"><h3 class="instruction">DROP HERE</h3></div>');
			$('body').append(this.dropZone);
			this.dropZone.droppable( {
		    	accept: '.map-layer',
		    	hoverClass: '',
		    	drop: self.dataDrop
		    } );	

			this.$('form.search .search-query').on('click', function() {
				$(this).select();
			});
			this.$('form.search .search-query').keyup(function() {
				//self.searchClicked();
			});
	    	this.$('button.remove-query').hide();

	    	this.$scrollContent = this.$(this.subViewContainer);
	    	this.$scrollable = this.$scrollContent.parent();
			this.$scrollable.on('scroll', function(evt) {
			    clearTimeout($.data(this, 'scrollTimer'));
				$.data(this, 'scrollTimer', setTimeout(function() {
						// detect when user hasn't scrolled in 250ms, then
				        self.updateAfterScrolled(evt);
					}, 250));
			});

			this.initSpinner(this.$('.state-indicator'));

	        return this;
	    },

	    searchClicked: function(event)
	    {
	    	var query = this.$('.search-query').val();
	    	this.resetPageParams();
	    	this.searchParams.q = query;
	    	this.$('button.remove-query').toggle(query != '');
	    	this.fetchResults(this.searchParams);

	    	return false;
	    },

	    removeQueryClicked: function(event)
	    {
	    	this.$('.search-query').val('');
	    },

	    updateFeatureCollectionList: function(emptyFirst) 
	    {
	    	var self = this,
	    		collection = this.collection;
	    	if (emptyFirst) {
		    	this.$(this.subViewContainer).empty();
	    	}

			collection.each(function(model, index) { 
				var mapLayer = new MapLayer({
						featureCollection: model.attributes,
						layerOptions: model.attributes.defaults
					}),
	            	mapLayerView = new MapLayerView({model: mapLayer});
	            mapLayer.isEnabled = function() { return true; };
            	mapLayerView.expandContent = false;
            	mapLayerView.expandLayerDetails = true;
            	mapLayerView.legendViewOptions.autoHide = false;
	            self.appendSubView(mapLayerView.render());

				mapLayerView.$el.draggable({
					revert: 'invalid',
					stack: self.dropZone,
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

	            mapLayerView.$el.hide().slideDown('fast');
			});

			var numResults = this.numResults();
			if (!this.isLastPage) {
				numResults += '+';
			}

	    	this.$('form.search .help-block').text(
	    		numResults == 1 ?  
	    		__('%(num)s collection found', {num: numResults})
	    		: __('%(num)s collections found', {num: numResults})
	    	);
	    },

	    numResults: function() 
	    {
	    	return this.$(this.subViewContainer).children().length;
	    },

		fetchResults: function(params, success, error) 
		{	
			var self = this;	
			self.isLoading = true;
			self.showSpinner();
			this.dataCollectionsFetched = true;
			console.log('fetchResults', params);
			this.collection.fetch({
				data: params,
				success: function(collection, response, options) {
					self.isLoading = false;
					self.hideSpinner();
		    		if (!collection.length || collection.length < self.searchParams.l) {
			    		self.isLastPage = true;
		    		}
					if (success) {
						success(collection, response, options);
					} else {
						self.updateFeatureCollectionList(true);
					}
				},
				error: function(collection, response, options) {
					console.error('failed to fetch collections');
					self.isLoading = false;
					self.hideSpinner();
					if (error) {
						error(collection, response, options);
					}
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

	_.extend(DataLibraryView.prototype, SpinnerMixin);

	return DataLibraryView;
});
