define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'permissions',
	'models/map-layer',
	'views/panel-view-base',
	'views/map-layer-view',
	'mixins/scroll-paginator-mixin',
	'mixins/spinner-mixin',
	'collections/geo-feature-collections'
], function($, _, Backbone, config, utils, permissions,
	MapLayer, PanelViewBase, MapLayerView, 
	ScrollPaginatorMixin, SpinnerMixin, GeoFeatureCollections) {
    "use strict";

	var DataLibraryView = PanelViewBase.extend({

		draggable: false,

	    events: {
			'submit form.search, keypress form.search .search-query': 'searchLibrary',
			'click button.remove-query': 'removeQueryClicked',
	    },

	  	subViewContainer: '.collections-list',
	    prevQuery: '',
	    dataCollectionsFetched: false,

	    initialize: function(options) 
	    {
	    	var self = this;
	    	DataLibraryView.__super__.initialize.apply(this, arguments);
		    this.collection = new GeoFeatureCollections();
		    this.listenTo(app, 'user:login', function(model) {
		    	self.render();
		    	self.searchLibrary();
		    });
	    },

	    loadNextPage: function(event) 
	    {
	    	if (this.isLoading || this.isLastPage) return;
	    	var self = this;
	    	this.searchParams.p++;
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
				//self.searchLibrary();
			});

			this.initScrollable(this.$(this.subViewContainer).parent(),
				this.$(this.subViewContainer), 30);

			this.initSpinner(this.$('.state-indicator'));
			this.$removeQueryParent = this.$('button.remove-query').parent();
			this.$removeQueryButton = this.$('button.remove-query').remove();

			if (!permissions.currentUser()) {
				this.$('.type-toggles li[data-type="user"]').removeClass('active')
					.remove();
				this.$('.type-toggles li[data-type="public"]').addClass('active');
			}

			this.$('.type-toggles > li > a').on('shown.bs.tab', function(evt) {
				self.searchLibrary();
			});

			this.$('.no-objects').addClass('hidden');

	        return this;
	    },

	    searchLibrary: function(event)
	    {
	    	var query = this.$('.search-query').val();
	    	this.resetPageParams();
	    	this.searchParams.q = query;
			self.$('.no-objects').addClass('hidden');
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

		removeSubViews: function(statusText)
		{
	    	DataLibraryView.__super__.removeSubViews.apply(this, arguments);	    	
			this.$('.status-message').text(statusText);
		},    

	    updateFeatureCollectionList: function(emptyFirst) 
	    {
	    	var self = this,
	    		collection = this.collection;
	    	if (emptyFirst) {
	    		this.removeSubViews();
	    	}

			collection.each(function(model, index) { 
				var mapLayer = new MapLayer({
						featureCollection: model.attributes,
						layerOptions: model.attributes.defaults
					}).initCollections(),
	            	mapLayerView = new MapLayerView({model: mapLayer});
	            mapLayer.isEnabled = function() { return true; };
            	mapLayerView.expandContent = false;
            	mapLayerView.expandLayerDetails = true;
            	mapLayerView.legendViewOptions.autoHide = false;
            	mapLayerView.once('expand', function() {
            		setTimeout(function() {
            			mapLayer.fetchGraphs();
            		}, 500);
            	});
	            self.appendSubView(mapLayerView).render();
	            self.mapLayerViewPostRender(mapLayerView);
	            mapLayerView.$el.hide().slideDown('fast');
			});

			var numResults = this.numResults();
			if (!this.isLastPage) {
				numResults += '+';
			}

	    	this.$('.status-message').text(
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
	    	params.t = this.$('.type-toggles .active').attr('data-type');
			this.collection.fetch({
				data: params,
				success: function(collection, response, options) {
					self.isLoading = false;
					self.hideSpinner();

					if (!collection.length) {
						self.$('.no-objects.'+params.t)
							.removeClass('hidden').hide().fadeIn('fast');
					}

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
		
	});

	_.extend(DataLibraryView.prototype, ScrollPaginatorMixin);
	_.extend(DataLibraryView.prototype, SpinnerMixin);

	return DataLibraryView;
});
