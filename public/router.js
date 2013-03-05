define([
	'jquery',
	'underscore',
	'backbone',
	'views/homepage-view',
	'views/header-view',
	'views/setup-view',
	'views/map-ol-view',
	'views/layers-panel-view',
	'views/data-detail-view',
	'views/map-info-view',
	'views/map-layer-editor-view',
	'views/map-layer-view',
	'views/data-library-view',
	'views/data-import-view',
	'views/modal-view',
	'views/share-view',
	'collections/geo-feature-collection',
	'models/map',
	'models/map_layer'
], function($, _, Backbone, HomepageView, HeaderView, 
	SetupView, MapOLView, LayersPanelView, DataDetailView,
	MapInfoView, MapLayerEditorView,
	MapLayerView, DataLibraryView, DataImportView,
	ModalView, ShareView,
	GeoFeatureCollection, Map, MapLayer) {
	
	var AppRouter = Backbone.Router.extend({

	  	// custom routing happens in initialize()
		routes: {},

		defaultRoutes: {
			"": "homeRoute",
			"removed": "homeRoute",

			"admin/:slug": "mapAdminRoute",
			"admin/:slug/:view": "mapAdminRoute",
			"admin/:slug/:view/:pos": "mapAdminRoute",

			":slug": "mapRoute",
			":slug/:view": "mapRoute",
			":slug/:view/:pos": "mapRoute",
		},

	    byHostRoutes: {
			"removed": "homeRoute",

			"admin": "mapAdminRouteByHost",
			"admin/:view": "mapAdminRouteByHost",
			"admin/:view/:pos": "mapAdminRouteByHost",

			"": "mapRouteByHost",
			":view": "mapRouteByHost",
			":view/:pos": "mapRouteByHost",
	    },

	    getRoutes: function() 
	    {
	    	var r;
	    	if (window.MAP_SLUG) {
	    		console.log('route by custom host');
	    		r = this.byHostRoutes;
	    	} else {
	    		console.log('route by slug');
	    		r = this.defaultRoutes;
	    	}
	    	var routes = [];
	    	for (var k in r) {
	    		routes.unshift([
	    			k,
	    			r[k]
	    		]);
	    	}
	    	return routes;
	    },

	    setUIReady: function()
	    {
			// remove site loading indicator
			$('#center-spinner').hide('fast', function() {
				$(this).remove();
			});
	    },

	    initialize: function() 
	    {
			var self = this;
		    _.each(this.getRoutes(), function(route) {
		    	self.route.apply(self, route);
		    });

		    this.map = null;
			this.firstLoad = true;
			this.isRendered = false;
			this.mapLayerSubViewsAttached = false;
			this.mapLayerEditorViews = {};

			this.settingsVisible = true;
			this.graphVisible = false;
			this.dataLibraryVisible = false;
			this.chatVisible = false;

			this.vent = _.extend({}, Backbone.Events);
			this.adminRoute = false;
			this.routingByHost = false;

		 	this.listenTo(this.vent, 'showMapLayerEditor', this.showMapLayerEditor);
		 	this.listenTo(this.vent, 'viewOptionsChanged', this.viewOptionsChanged);

			this.isEmbedded = window != window.top;
	    }, 

	    mapRoute: function(slug, viewName, pos)
	    {
			var mapViewName,
				viewBase,
				viewStyle,
				center, 
				zoom;

			if (viewName) {
				this.setupRoute = viewName == 'setup';
				if (!this.setupRoute) {
					var split = viewName.split(':');
					mapViewName = split.shift();
					if (split.length > 1) {
						viewBase = split.shift();
					}
					if (split.length) {
						viewStyle = split.shift();
					}
				} else {
					$('#app').empty();
				}
			}

			if (pos != undefined) {
				var split = pos.split(',');
				if (split.length == 3) {
					zoom = split.pop();
				}
				if (split.length == 2) {
					x = parseFloat(split.shift());
					y = parseFloat(split.shift());
					if (!isNaN(x) && !isNaN(y)) {
						center = [x, y];
					}
				}
			}

	    	console.log('slug:', slug, 'mapViewName:', mapViewName, 'viewBase:', viewBase, 'viewStyle:', viewStyle, 'center:', center, 'zoom:', zoom);
			this.loadAndInitMap(slug, mapViewName, center, zoom, viewBase, viewStyle);
	    },

	    mapAdminRoute: function(slug, viewName, pos)
	    {
	    	this.adminRoute = true;
	    	this.mapRoute(slug, viewName, pos);
	    },

	    mapRouteByHost: function(viewName, pos) 
	    {
	    	this.routingByHost = true;
	   		return this.mapRoute(window.MAP_SLUG, viewName, pos);
	    },

	    mapAdminRouteByHost: function(viewName, pos) 
	    {
	    	this.routingByHost = true;
	   		return this.mapAdminRoute(window.MAP_SLUG, viewName, pos);
	    },

		homeRoute: function() 
		{		
			if (this.firstLoad) {
				this.firstLoad = false;
				this.homepageView = new HomepageView();
		        $('#app').append(this.homepageView.render().el);
			} else {
				window.location.reload(true);			
			}
		},

		genMapViewParam: function(mapViewName)
		{
	    	if (!mapViewName || mapViewName == 'map') {
	    		var addBase = this.mapView.viewBase && this.mapView.viewBase != DEFAULT_MAP_VIEW_BASE;
	    		var addStyle = addBase || (this.mapView.viewStyle && this.mapView.viewStyle != this.mapView.defaultViewStyle);
				mapViewName = this.mapViewName
					+ (addStyle || addBase ? ':' : '')
					+ (addBase ? this.mapView.viewBase + ':' : '')
					+ (addStyle ? (this.mapView.viewStyle ? this.mapView.viewStyle : 'default') : '');
	    	}
	    	return mapViewName;
		},

		getCurrentViewOptions: function() {
			return {
				viewName: this.mapViewName,
				viewBase: this.mapView.viewBase,
				viewStyle: this.mapView.viewStyle
			};
		},

	    genMapURI: function(mapViewName, opts, admin)
	    {
	    	var admin = (admin || admin == undefined) && this.adminRoute;
	    	mapViewName = this.genMapViewParam(mapViewName);

	    	return genMapURI(this.map.attributes, mapViewName, opts, admin, this.routingByHost ? false : 'publicslug');
	    },

	    genPublicURL: function(forVisibleMapArea)
	    {
			return genMapURL(this.map.attributes, (forVisibleMapArea ? this.getURIOptsForVisibleMapArea() : false), false);
	    },

	    getURIOptsForVisibleMapArea: function(visibleMapArea)
	    {
			if (!visibleMapArea) {
				var visibleMapArea = this.mapView.getVisibleMapArea();
			}
			var opts = {
				x: visibleMapArea.center[0],
				y: visibleMapArea.center[1],
				zoom: visibleMapArea.zoom,
				mapViewName: this.genMapViewParam('map')
			};
			var defaults = {
				x: (this.map.attributes.initialArea.center.length ? this.map.attributes.initialArea.center[0] : 0),
				y: (this.map.attributes.initialArea.center.length ? this.map.attributes.initialArea.center[1] : 0),
				zoom: (this.map.attributes.initialArea.zoom != undefined ? this.map.attributes.initialArea.zoom : 0)
			};
			if (defaults.x != opts.x || defaults.y != opts.y || defaults.zoom != opts.zoom) {
				return opts;
			}
			return {
				mapViewName: opts.mapViewName
			};
		},

		genMapURIForVisibleArea: function(visibleMapArea)
		{
			return app.genMapURI(null, this.getURIOptsForVisibleMapArea(visibleMapArea));
		},

	    genAdminURL: function()
	    {
			return genMapURL(this.map.attributes, false, true);

	    },

		loadAndInitMap: function(slug, mapViewName, center, zoom, viewBase, viewStyle)
		{
			var self = this;
			if (!this.map) {
				this.map = new Map({publicslug: slug});
				this.map.fetch({
					success: function(model, response, options) {
						console.log('initMapInfo');
						self.initMap();
						var opts = self.map.attributes.viewOptions || {};
						var or = function(a, b) { return a && a != '' ? a : b };
						self.initMapView(or(mapViewName, opts.viewName), 
							center, zoom, 
							or(viewBase, opts.viewBase), or(viewStyle, opts.viewStyle));
					},
					error: function(model, xhr, options) {
						console.error('failed to load map', slug);
					}
				});
				return;
			}

			console.log('initMapView');
			self.initMapView(mapViewName, center, zoom, viewBase, viewStyle);
		},

		initMap: function() 
		{
			var self = this;
			this.mapLayersById = {};
			_.each(this.map.attributes.layers, function(layerAttributes) {
				self.initMapLayer(self.map.newLayerInstance(layerAttributes));
			});
		},

	    initMapView: function(mapViewName, center, zoom, viewBase, viewStyle) 
	    {
			var self = this;

			if (!self.isRendered) {
				self.render(mapViewName);
			}

			this.mapViewName = mapViewName;
				
			if (this.mapView) {
				this.mapView.remove();
				this.mapView = null;
			}

			switch (this.mapViewName) {
				default:
				case 'map':
					var viewClass = MapOLView;
					this.mapViewName = 'map';
					break;
				case 'globe':
					var viewClass = MapGLView;
					break;
			}		
			$('.map-view-toggle').each(function() {
				$(this).toggleClass('active', $(this).hasClass(self.mapViewName));
			});

			var visibleMapArea = this.getDefaultVisibleMapArea();
			if (center) {
				visibleMapArea.center = center;
			}
			if (zoom) {
				visibleMapArea.zoom = zoom;
			}

	        this.mapView = new viewClass({
				vent: self.vent,
				visibleMapArea: visibleMapArea
			});

	        this.listenTo(this.mapView, 'visibleAreaChanged', this.visibleMapAreaChanged);
		 	this.listenTo(this.mapView, 'feature:select', this.showDetailData);
		 	this.listenTo(this.mapView, 'feature:unselect', this.hideDetailData);
		 	this.listenTo(this.mapView, 'view:ready', this.mapViewReady);

			var mapEl = this.mapView.render().el;
			$('#app').append(mapEl);
			this.$mainEl = $(mapEl);
			this.mainEl = this.$mainEl[0];
			this.mapView.renderMap(viewBase, viewStyle);

			this.viewOptionsChanged(this.mapView);

	        var snap = $('<div class="snap top" /><div class="snap right" />');
			this.$mainEl.append(snap);

	        this.layersPanelView = new LayersPanelView({vent: this.vent}).render();
	        this.attachPanelView(this.layersPanelView);
	    },

		mapViewReady: function() 
		{
			var self = this;
			// give map a moment to load tiles
			setTimeout(function() {
				console.log('mapViewReady: attaching sub views for all layers');
				self.setUIReady();
				// wait for map to be ready before we add sub views for layers
				// because the map baselayer determines projection, etc.
				self.attachMapLayerSubViews();
				self.fetchMapFeatures();
			}, 200);
		},

		getMapLayer: function(layerId)
		{
			return this.mapLayersById[layerId];
		},

		initMapLayer: function(model, animate)
		{
			var self = this;

			console.log('initMapLayer', model.id);
			this.mapLayersById[model.id] = model;
			// do not fetch features yet if we are waiting for mapViewReady
			if (this.mapLayerSubViewsAttached) {
				this.attachSubViewsForMapLayer(model, animate);
				this.fetchMapFeatures();
			}

		    this.listenTo(model, 'toggle:enabled', function() {
				self.fetchMapFeatures();		    	
				// wait for animations to complete before fetching
				/*if (model.isEnabled()) {
					setTimeout(function() {
						self.fetchMapFeatures();		    	
					}, 300);
				}*/
		    });

		    if (model.getDataStatus() != DataStatus.COMPLETE) {
		    	this.pollForMapLayerStatus(model, INITIAL_POLL_INTERVAL);
		    }

			return model;
		},

		pollForMapLayerStatus: function(model, interval)
		{
			var self = this;
			// set up timeout that calls this method again
			if (interval) {
				setTimeout(function() {
					self.pollForMapLayerStatus(model);
				}, interval);
				return;
			}
			model.once('sync', function() {
				if (model.canDisplayValues()) {
					// if now complete, fetch features
					self.fetchMapFeatures();
				}
				if (model.getDataStatus() == DataStatus.COMPLETE) return;
				// otherwise, retry in a bit
				self.pollForMapLayerStatus(model, POLL_INTERVAL);
			});
			// excplitly accept incomplete layers
			model.fetch({data: {incomplete: true}});
		},

		attachSubViewsForMapLayer: function(model, animate)
		{
			console.log('attachSubViewsForMapLayer', model.id, model.getDisplay('title'));
			var mapLayerView = new MapLayerView({model: model, vent: this.vent}).render();
			this.layersPanelView.appendSubView(mapLayerView);
			if (animate) {
				mapLayerView.hide().show('fast');
			}
			this.mapView.attachLayer(model);
			model.featureCollection.setVisibleMapArea(this.mapView.getVisibleMapArea());
		},

		attachMapLayerSubViews: function()
		{
			var self = this;
			if (!self.mapLayerSubViewsAttached) {
				self.mapLayerSubViewsAttached = true;
				_.each(self.mapLayersById, function(mapLayer) {
					self.attachSubViewsForMapLayer(mapLayer);
				});
				this.layersPanelView.show('fast');
			}
		},

		visibleMapAreaChanged: function()
		{
			var area = this.mapView.getVisibleMapArea();
			_.each(this.mapLayersById, function(mapLayer) {
				// this will result in featureCollection.isCurrent() returning false
				mapLayer.featureCollection.setVisibleMapArea(area);
			});
			this.fetchMapFeatures();
		},

		fetchMapFeatures: function()
		{
			_.each(this.mapLayersById, function(mapLayer) {
				// only fetch features for enabled and non-current layers
				if (mapLayer.isEnabled() && mapLayer.canDisplayValues()
					&& !mapLayer.featureCollection.isCurrent()) {
						console.log('Fetching features for', mapLayer.id, mapLayer.getDisplay('title'));
						mapLayer.featureCollection.fetch();
				}
			});
		},

		getDefaultVisibleMapArea: function()
		{
			var visibleMapArea = DEFAULT_MAP_AREA;
			if (this.map.attributes.initialArea && 
				this.map.attributes.initialArea.center.length) {
					visibleMapArea.center = this.map.attributes.initialArea.center;
			}
			if (this.map.attributes.initialArea.zoom != undefined) {
				visibleMapArea.zoom = this.map.attributes.initialArea.zoom;
			}
			return visibleMapArea;
		},


		viewOptionsChanged: function(view)
		{
			var self = this;
			if (view == this.mapView) {
				$("#app").removeClass(function(index, css) {
				    return (css.match(/\bmap-style-\S+/g) || []).join(' ');
				});

				if (this.mapView.viewStyles) {
					$('#app').addClass('map-style-'+this.mapView.viewStyle);

					var li = [];
					$.each(this.mapView.viewStyles, function(styleName, title) {
						var s = styleName;
						li.push('<li' + (s == self.mapView.viewStyle ? ' class="inactive"' : '') + '>'
							+ '<a href="#' + s + '">' 
							+ title
							+ '</a></li>');
					});
					$('#viewStyle .dropdown-menu').html(li.join(''));
					$('#viewStyleCurrent').text(this.mapView.viewStyles[this.mapView.viewStyle]);
					$('#viewStyle').show();
				} else {
					$('#viewStyle').hide();
				}	

				if (this.mapView.viewBase) {
					var li = [];
					for (var key in this.mapView.ViewBase) {
						var cls = this.mapView.ViewBase[key].prototype;
						li.push('<li' + (key == self.mapView.viewBase ? ' class="inactive"' : '') + '>'
							+ '<a href="#' + key + '">' 
							+ '<span class="view-base-thumb"' + (key != 'blank' ? ' style="background: url(/assets/baselayer-thumbs/' + key + '.png)"' : '') + '></span>'
							+ '<span class="view-base-caption">' + cls.providerName + '</span>'
							+ '</a></li>');
					}
					$('#viewBase .dropdown-menu').html(li.join(''));
					$('#viewBaseCurrent').text(this.mapView.ViewBase[this.mapView.viewBase].prototype.providerName);
					$('#viewBaselayer').show();
				} else {
					$('#viewBaselayer').hide();
				}	

			}
		},

	    setViewStyle: function(viewStyle, navigate)
	    {
	    	this.vent.trigger('updateViewStyle', viewStyle);
	    	if (navigate || navigate == undefined) {
				app.navigate(app.genMapURIForVisibleArea(), {trigger: false});
	    	}
		},

	    setViewBase: function(viewBase, navigate)
	    {
	    	this.vent.trigger('updateViewBase', viewBase);
	    	if (navigate || navigate == undefined) {
				app.navigate(app.genMapURIForVisibleArea(), {trigger: false});
	    	}
		},

	    showMapInfo: function() 
	    {
	        this.mapInfoView = new MapInfoView({model: this.map}).render();
			this.mapInfoView.show();
	    },

	    toggleDataLibrary: function() 
	    {
			if (!this.dataLibraryVisible) {
				this.dataLibraryView = new DataLibraryView();
			    this.$mainEl.append(this.dataLibraryView.render().el);
				this.dataLibraryVisible = true;
			} else {
				this.dataLibraryView.remove();
				this.dataLibraryVisible = false;
			}		
	    },

	    showShareLink: function()
	    {
			var shareView = new ShareView().render();
			shareView.show();
	    },

	    showAbout: function() 
	    {
			var modalView = new ModalView().render();
			modalView.setTitle('About GeoSense');
			modalView.setBody(
					'<p class="well">Designed and engineered by <strong>Anthony DeVincenzi & Samuel Luescher</strong> at the <a href="http://www.mit.edu">Massachusetts Institute of Technology</a> / <a href="http://media.mit.edu/">MIT Media Lab</a>, with the friendly support of <a href="http://tangible.media.mit.edu/">Hiroshi Ishii</a> and <a href="http://safecast.org/">Safecast</a>.</p>'
					+ '<p>GeoSense is an open publishing platform for visualization, social sharing, and data analysis of geospatial data. It explores the power of data analysis through robust layering and highly customizable data visualization. GeoSense supports the simultaneous comparison and individual styling for multiple massive data sources ranging from 10 thousand to 10 million geolocated points.</p>'
					+ '<p>Powered by <a href="http://nodejs.org/">Node.js</a> and <a href="http://www.mongodb.org/">MongoDB</a>, head start thanks to <a href="http://backbonejs.org/">Backbone</a> and <a href="http://twitter.github.com/bootstrap/">Bootstrap</a>. Some interface elements courtesy of <a href="http://glyphicons.com/">glyphicons.com</a>.</p>');
			modalView.show();
	    },

	    showSetupView: function() 
	    {
			this.setupView.show();	
	    },
		
		isMapAdmin: function()
		{
			return this.adminRoute && this.map.attributes.admin; 
		},

		render: function() 
		{
			console.log('main render');
			var self = this;

			window.document.title = this.map.get('title') + ' – GeoSense';

	        if (this.isEmbedded) {
	        	$('body').addClass('embed');	
	        }

	 		this.headerView = new HeaderView({vent: this.vent, model: this.map});
	        $('#app').append(this.headerView.render().el);

			//this.chatView = new ChatView({vent: this.vent});
	        //$('#app').append(this.chatView.render().el);

			//this.graphView = new GraphView({vent: this.vent});
			//$('#app').append(this.graphView.render().el);
			
			$('body').css("overflow","hidden");

			// TODO: Detect embed 
			if (window.location.href.indexOf('4D4R0IjQJYzGP0m') != -1) {
				$('body').addClass("embed");
			}
			
			if (this.isMapAdmin()) {
				this.setupView = new SetupView({model: this.map}).render();
				if (this.setupRoute) {
					this.showSetupView();
				}
			}
			
			self.isRendered = true;
		},

		getURLParameter:function(name) 
		{
		    return decodeURI(
		        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
		    );
		},

		toggleDataImport: function() 
		{
			if (!this.dataImportView) {
				this.dataImportView = new DataImportView({vent: this.vent}).render();
			}
	        this.dataImportView.show();
		},

	    showDetailData: function(model, panelAnimation)    
		{
			if (!this.dataDetailView) {
		        this.dataDetailView = new DataDetailView().render();
			}
			this.dataDetailView.setModel(model);
	        this.attachPanelView(this.dataDetailView);
			this.dataDetailView.snapToView(this.layersPanelView, 'left', true)
				.hide().show('fast');
		},

	    hideDetailData: function(model)
		{
			if (this.dataDetailView) {
				this.dataDetailView.detach();
			}
		},

		showMapLayerEditor: function(model)
		{
			var layerId = model.id;
			var self = this;
			if (!this.mapLayerEditorViews[layerId]) {
				this.mapLayerEditorViews[layerId] = new MapLayerEditorView({
					vent: this.vent,
					model: this.getMapLayer(layerId)
				}).render();
			}

			for (var k in this.mapLayerEditorViews) {
				if (layerId != this.mapLayerEditorViews[k].model.get('_id')) {
					this.mapLayerEditorViews[k].detach();
				} else {
					if (!this.mapLayerEditorViews[k].isVisible()) {
						this.mapLayerEditorViews[k].hide();
						this.attachPanelView(this.mapLayerEditorViews[k]);
						this.mapLayerEditorViews[k].snapToView(this.layersPanelView, 'left', true)
							.show('fast');
					} else {
						this.mapLayerEditorViews[k].hide('fast', function() {
							self.mapLayerEditorViews[k].detach();
						});
					}
				}
			}
		},

		attachPanelView: function(panelView)
		{
			this.$mainEl.append(panelView.el);
		},

		saveNewMapLayer: function(featureCollectionId)
		{	
			var self = this;
			var layer = this.map.newLayerInstance({
				featureCollection: {
					_id: featureCollectionId
				}
			});
			console.log('saving new map layer', layer);
			// success will before before attributes are set, hence wait for sync:
			layer.once('sync', function() { 
				self.initMapLayer(layer, true);
			});
			layer.save({}, {
	    		success: function(model, response, options) {
	    			console.log('new map layer saved', model);
	    		},
	    		error: function(model, xhr, options) {
					console.error('failed to save new map layer');
	    		}
			});	
		},

	});

	var initialize = function() {
		app = new AppRouter();
		if (!Backbone.history.start({ pushState: true })) {
			$('#app').html('page not found');
		}
	};

 	return {
		initialize: initialize
  	};	
});