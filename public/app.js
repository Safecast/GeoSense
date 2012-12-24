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

    initialize: function() 
    {
		var self = this;
	    _.each(this.getRoutes(), function(route) {
	    	self.route.apply(self, route);
	    });

		this.firstLoad = true;
		this.pointCollections = {};
		this.timeBasedPointCollections = {};
		this.isRendered = false;
		this.mapLayersInitialized = false;

		this.settingsVisible = true;
		this.graphVisible = false;
		this.dataLibraryVisible = false;
		this.chatVisible = false;

		this.vent = _.extend({}, Backbone.Events);
		this.vent.bind('mapViewReady', function() {
			if (!self.mapLayersInitialized) {
				self.initMapLayers();
			}
		});

		this.adminRoute = false;
		this.routingByHost = false;

		_.bindAll(this, "updateMapLayer");
	 	this.vent.bind("updateMapLayer", this.updateMapLayer);

		_.bindAll(this, "toggleValFormatter");
	 	this.vent.bind("toggleValFormatter", this.toggleValFormatter);

		_.bindAll(this, "toggleLayerVisibility");
		this.vent.bind("toggleLayerVisibility", this.toggleLayerVisibility);

		_.bindAll(this, "viewOptionsChanged");
	 	this.vent.bind("viewOptionsChanged", this.viewOptionsChanged);

		_.bindAll(this, "updateVisibleDate");
	 	this.vent.bind("updateVisibleDate", this.updateVisibleDate);

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
	        $('#home').append(this.homepageView.render().el);
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

    genMapURI: function(mapViewName, opts, admin)
    {
    	var admin = (admin || admin == undefined) && this.adminRoute;
    	mapViewName = this.genMapViewParam(mapViewName);

    	return genMapURI(this.mapInfo, mapViewName, opts, admin, this.routingByHost ? false : 'publicslug');
    },

    genPublicURL: function(forVisibleMapArea)
    {
		return genMapURL(this.mapInfo, (forVisibleMapArea ? this.getURIOptsForVisibleMapArea() : false), false);
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
			x: (this.mapInfo.initialArea.center.length ? this.mapInfo.initialArea.center[0] : 0),
			y: (this.mapInfo.initialArea.center.length ? this.mapInfo.initialArea.center[1] : 0),
			zoom: (this.mapInfo.initialArea.zoom != undefined ? this.mapInfo.initialArea.zoom : 0)
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
		return genMapURL(this.mapInfo, false, true);

    },

	loadAndInitMap: function(slug, mapViewName, center, zoom, viewBase, viewStyle)
	{
		var self = this;
		switch (mapViewName) {
			default:
				mapViewName = 'map';
				break;
			case 'map':
				break;
			case 'globe':						
				break;
		}
		if (!self.mapInfo) {
			$.ajax({
				type: 'GET',
				url: '/api/map/' + slug,
				success: function(data) {
					self.initMapInfo(data);
					self.initMapView(mapViewName, center, zoom, viewBase, viewStyle);
				},
				error: function() {
					console.error('failed to load map', slug);
				}
			});
			return;
		}
		self.initMapView(mapViewName, center, zoom, viewBase, viewStyle);
	},

	initMapInfo: function(mapInfo) 
	{
		var self = this;
		self.mapInfo = mapInfo;
		for (var i = self.mapInfo.layers.length - 1; i >= 0; i--) {
			var mapLayer = self.mapInfo.layers[i];
			mapLayer.sessionOptions = {
				visible: mapLayer.options.visible
			};

			if (mapLayer.options.valFormat) {
				mapLayer.sessionOptions.valFormatters = [];
				for (var j = 0; j == 0 || j < mapLayer.options.valFormat.length; j++) {
					var valFormat = null;
					if (j < mapLayer.options.valFormat.length) {
						valFormat = mapLayer.options.valFormat[j];
					}
					if (!valFormat) {
						valFormat = {};
					}
					if (!valFormat.unit) {
						valFormat.unit = mapLayer.pointCollection.unit;
					}
					mapLayer.sessionOptions.valFormatters.push(new ValFormatter(valFormat));
				}
				mapLayer.sessionOptions.valFormatter = mapLayer.sessionOptions.valFormatters[0];
			}
		}
	},

	toggleLayerVisibility: function(pointCollectionId, state)
	{
		var self = this;
		var collection = this.pointCollections[pointCollectionId];
		var mapLayer = this.getMapLayer(pointCollectionId);
		mapLayer.sessionOptions.visible = state;
		console.log('toggleLayerVisibility '+pointCollectionId, state, (state ? 'fetched: '+collection.visibleMapAreaFetched : ''));
		if (state && !collection.visibleMapAreaFetched) {
			// wait for animations to complete before fetching
			setTimeout(function() {
				self.fetchMapLayer(pointCollectionId);	
			}, 300);
			
		}
	},

	toggleValFormatter: function(mapLayer, formatter)
	{
		mapLayer.sessionOptions.valFormatter = formatter;
	},

	getDefaultVisibleMapArea: function()
	{
		var visibleMapArea = DEFAULT_MAP_AREA;
		if (this.mapInfo.initialArea && 
			this.mapInfo.initialArea.center.length) {
				visibleMapArea.center = this.mapInfo.initialArea.center;
		}
		if (this.mapInfo.initialArea.zoom != undefined) {
			visibleMapArea.zoom = this.mapInfo.initialArea.zoom;
		}
		return visibleMapArea;
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
			case 'map':
				var viewClass = MapOLView;
				$('#navMap').addClass('active');
				$('#navGlobe').removeClass('active');
				break;
			case 'globe':
				var viewClass = MapGLView;
				$('#navMap').removeClass('active');
				$('#navGlobe').addClass('active');
				break;
		}		
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

		var mapEl = this.mapView.render().el;
		$('#app').append(mapEl);
		this.mapView.start(viewBase, viewStyle);

		this.viewOptionsChanged(this.mapView);

        var snap = $('<div class="snap top" /><div class="snap right" />');
		$(mapEl).append(snap);

        this.dataInfoView = new DataInfoView({vent: this.vent});
		$(mapEl).append(this.dataInfoView.render().el);

        /*this.timelineView = new TimelineView({vent: this.vent});
		$(mapEl).append(this.timelineView.render().el);*/

        this.mapInfoView = new MapInfoView({vent: this.vent, mapInfo: this.mapInfo});
        this.mapInfoView.render();

		/*$(mapEl).append(this.mapInfoView.render().el);
		$(this.mapInfoView.el).hide();*/
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
						+ '<a href="#' + s + '" data-toggle="dropdown">' 
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
						+ '<a href="#' + key + '" data-toggle="dropdown">' 
						+ '<span class="view-base-thumb" style="background: url(/assets/baselayer-thumbs/' + key + '.png)"></span>'
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
		//$(this.mapInfoView.el).show();
		this.mapInfoView.show();
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
		modalView.setBody(nl2p('GeoSense is an open publishing platform for visualization, social sharing, and data analysis of geospatial data. It explores the power of data analysis through robust layering and highly customizable data visualization. GeoSense supports the simultaneous comparison and individual styling for multiple massive data sources ranging from 10 thousand to 10 million geolocated points.'
				+ '\n\nDeveloped by Anthony DeVincenzi and Samuel Luescher of the MIT Media Lab, alongside Hiroshi Ishii and Safecast.org.'));
		modalView.show();
    },

    showSetupView: function() 
    {
		this.setupView.show();	
    },
	
	isMapAdmin: function()
	{
		return this.adminRoute && this.mapInfo.admin; 
	},

	render: function() 
	{
		console.log('app.render');
		var self = this;

		window.document.title = this.mapInfo.title + ' – GeoSense';

        if (this.isEmbedded) {
        	$('body').addClass('embed');	
        }

 		this.headerView = new HeaderView({vent: this.vent, mapInfo: this.mapInfo});
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
			this.sideBarView = new SideBarView({vent: this.vent});
	        $('#app').append(this.sideBarView.render().el);
	        $('#app').addClass('with-sidebar');
			this.setupView = new SetupView({vent: this.vent, mapInfo: this.mapInfo}).render();
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

	initMapLayers: function()
	{
		if (this.mapInfo.layers) {
			for (var i = 0; i < this.mapInfo.layers.length; i++) {						
				var pointCollectionId = this.mapInfo.layers[i].pointCollection._id;
				this.initMapLayer(pointCollectionId)
			}
		}
		this.mapLayersInitialized = true;
        
        if (this.mapInfo.tour && this.mapInfo.tour.steps.length) {
			var mapEl = this.mapView.el;
	        this.mapTourView = new MapTourView({vent: this.vent, mapInfo: this.mapInfo});
			$(mapEl).append(this.mapTourView.render().el);
        } else {
			if (this.mapInfo.layers) {
				for (var i = 0; i < this.mapInfo.layers.length; i++) {						
					var pointCollectionId = this.mapInfo.layers[i].pointCollection._id;
					var layer = this.getMapLayer(pointCollectionId);
		        	this.vent.trigger('toggleLayerVisibility', pointCollectionId, layer.sessionOptions.visible);
				}
			}
        }
	},

	initMapLayer: function(pointCollectionId)
	{
		var self = this;

		var layer = this.getMapLayer(pointCollectionId);
		console.log('initMapLayer '+pointCollectionId, layer);

		var mapArea = self.mapView.getVisibleMapArea();							
		var collectionOptions = {
			pointCollectionId: pointCollectionId, 
			mapId: app.mapInfo._id, 
			mapLayer: layer
		};

		var collection = this.pointCollections[pointCollectionId] = new MapPointCollection(collectionOptions);
		self.addDataPanelViews(pointCollectionId);
		self.mapView.addCollection(collection);

		//if (layer.pointCollection.status == DataStatus.COMPLETE) {
		//	this.fetchMapLayer(pointCollectionId);
		//} else {
		//	self.vent.trigger("setStateType", 'loading', collection.pointCollectionId);
		//	app.pollForNewPointCollection(pointCollectionId, INITIAL_POLL_INTERVAL);
		//}

		$('.data-info').show();

		//Fetch time based point collections for graph
		/*if (1||data.timeBased) {
			collectionOptions.urlParams = {
				t: 'w'
			};
			var collection = this.timeBasedPointCollections[pointCollectionId] = new MapPointCollection(collectionOptions);
			collection.setVisibleMapArea(self.mapView.getVisibleMapArea());
			if (layer.options.visible) {
				collection.fetch({success: function(collection) {
					self.graphView.addCollection(collection);
				}});
			}
		}*/
	},

	updateVisibleDate: function(fromDate, toDate) 
	{
		var self = this;
		$.each(this.pointCollections, function(key, collection) {
			collection.urlParams.t = 'w';
			collection.urlParams.from = fromDate.format('%Y-%m-%d');
			collection.urlParams.to = toDate.format('%Y-%m-%d');
			self.fetchMapLayer(collection.pointCollectionId);
			console.log(collection.urlParams);
		});
	},

	updateMapLayer: function(updatedLayer)
	{
		console.log('updateMapLayer', updatedLayer);
		var layer = this.getMapLayer(updatedLayer.pointCollection._id);
		for (var k in updatedLayer) {
			layer[k] = updatedLayer[k];
		}
		this.vent.trigger('redrawMapLayer', layer);
	},

	pollForNewPointCollection: function(pointCollectionId, interval) 
	{
		var self = this;

		if (interval) {
			setTimeout(function() {
				self.pollForNewPointCollection(pointCollectionId);
			}, interval);
			return;
		}

		console.log('pollForNewPointCollection: '+pointCollectionId);
		$.ajax({
			type: 'GET',
			url: '/api/pointcollection/' + pointCollectionId,
		    error: function() {
				console.error('Failed to fetch new collection, trying again after timeout...');
		    },
		    success: function(data) {
		    	self.updatePointCollectionAfterPolling(data);
		    }
		});
	},

	updatePointCollectionAfterPolling: function(data) 
	{
		var pointCollectionId = data._id;
		var layer = this.getMapLayer(pointCollectionId);
		layer.pointCollection = data;

		if (data.status !== DataStatus.COMPLETE) {
			console.log('Collection '+pointCollectionId+' is busy, polling again after timeout...');
			this.pollForNewPointCollection(pointCollectionId, POLL_INTERVAL);					
			this.vent.trigger("setStateType", 'loading', layer.pointCollection._id);
		} else {
			this.fetchMapLayer(pointCollectionId);
		}
	},

	/*
	this method is passed a collection instance since for the same point collection we might
	fetch using different instances, for instance for time-based graphs.
	*/
	fetchPointCollection: function(pointCollectionId, collection)
	{
		var self = this;
		self.vent.trigger("setStateType", 'loading', pointCollectionId);

		collection.fetch({success: function(collection) {
			self.vent.trigger("setStateType", 'complete', pointCollectionId);
		}});
	},

	/*
	this method first updates a collection's visible map area, and then fetches it.
	*/
	fetchMapLayer: function(pointCollectionId)
	{
		var self = this;
		var layer = this.getMapLayer(pointCollectionId);
		var collection = this.pointCollections[pointCollectionId];

		collection.setVisibleMapArea(this.mapView.getVisibleMapArea());
		console.log('fetch', layer);
		if (layer.sessionOptions.visible) {
			this.fetchPointCollection(pointCollectionId, collection);
	
			// TODO: fetch and render timeline
			/*if (collection.timeBased) {
				//this.timelineView.renderGraph(tmpUrl);
			}*/
		}

	},
	
	bindCollectionToMap: function(pointCollectionId)
	{	
		var self = this;
		$.ajax({
			type: 'POST',
			url: '/api/bindmapcollection/' + this.mapInfo._id + '/' + pointCollectionId,
			success: function(data) {
				self.initMapInfo(data);
				self.initMapLayer(pointCollectionId);
			},
			error: function() {
				console.error('failed to join map with collection');
			}
		});	
	},
	
	getMapLayer: function(pointCollectionId)
	{
		for (var i = 0; i < this.mapInfo.layers.length; i++) {
			if (pointCollectionId == this.mapInfo.layers[i].pointCollection._id) {
				return this.mapInfo.layers[i];
			}
		}
	},
	
	addDataPanelViews:function(pointCollectionId) 
	{
		var viewOpts = {
			vent: this.vent,
			collection: this.pointCollections[pointCollectionId], 
			collectionId: pointCollectionId, 
			mapLayer: this.getMapLayer(pointCollectionId)
		};

		var sideBarDataView = new DataInspectorView(viewOpts);
		$('#dataContainer .accordion').append(sideBarDataView.render().el);

		var dataLegendView = new DataLegendView(viewOpts);
		var el = dataLegendView.render().el;
		$('#data-info-view .accordion').append(el);
		//$('.collapse', el).collapse('show');
	},

});

tpl.loadTemplates(['homepage', 'graph', 'setup', 'map-ol', 'map-gl', 'map-ge', 'header',
	'sidebar','data-inspector', 'data-legend', 'chat', 'modal', 'add-data', 
	'edit-data', 'data-library', 'data-info', 'map-info-modal', 'share', 'map-tour'/*, 'timeline'*/],
    function () {
        app = new AppRouter();
        if (!Backbone.history.start({ pushState: true })) {
	    	$('#app').html('page not found');
        }
	});
