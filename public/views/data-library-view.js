define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'models/map_layer',
	'views/panel-view-base',
	'views/map-layer-view',
	'mixins/spinner-mixin',
	'collections/geo-feature-collections'
], function($, _, Backbone, config, utils, MapLayer, PanelViewBase, MapLayerView, SpinnerMixin, GeoFeatureCollections) {
    "use strict";

	var DataLibraryView = PanelViewBase.extend({

		draggable: false,

	    events: {
			'submit form.search, keypress form.search .search-query': 'searchClicked',
			'click button.remove-query': 'removeQueryClicked',
	    },

	  	subViewContainer: '.collections-list',
	    prevQuery: '',
	    dataCollectionsFetched: false,

	    initialize: function(options) 
	    {
		    this.collection = new GeoFeatureCollections();
		    this.lastPage = true;
		    this.searchParams = {p: 0};
		    this.resultHeight = 30;
	    },

	    detectPageLimit: function()
	    {
			return Math.ceil(this.$scrollable.height() / this.resultHeight / 10) * 10;
	    },

	    resetPageParams: function()
	    {
	    	this.isLastPage = false;
	    	this.searchParams.p = 0;
			this.searchParams.l = this.detectPageLimit();
			return this;
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

			this.$('form.search .search-query').on('click', function() {
				$(this).select();
			});
			this.$('form.search .search-query').keyup(function() {
				//self.searchClicked();
			});

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
			this.$removeQueryParent = this.$('button.remove-query').parent();
			this.$removeQueryButton = this.$('button.remove-query').remove();

			if (!app.currentUser()) {
				this.$('.nav-tabs li[data-type="user"]').removeClass('active')
					.remove();
				this.$('.nav-tabs li[data-type="public"]').addClass('active');
			}

			this.$('a[data-toggle="tab"]').on('shown.bs.tab', function(evt) {
				self.searchClicked();
			});

	        return this;
	    },

	    searchClicked: function(event)
	    {
	    	var query = this.$('.search-query').val();
	    	this.resetPageParams();
	    	this.searchParams.q = query;
	    	if (query != '') {
	    		this.$removeQueryParent.append(this.$removeQueryButton);
	    	} else {
	    		this.$removeQueryButton.remove();
	    	}
	    	this.fetchResults(this.searchParams);
	    	self.$('.search-query').focus();

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
	            self.mapLayerViewPostRender(mapLayerView);
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

	    mapLayerViewPostRender: function(mapLayerView)
	    {
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
	    	params.t = this.$('.nav-tabs .active').attr('data-type');
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
		
	});

	_.extend(DataLibraryView.prototype, SpinnerMixin);

	return DataLibraryView;
});
