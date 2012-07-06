var AppRouter = Backbone.Router.extend({

    routes: {
		"": "homeRoute",
		"removed": "homeRoute",

		"admin/:slug": "mapAdminRoute",
		"admin/:slug/:view": "mapAdminRoute",
		"admin/:slug/:view/:pos": "mapAdminRoute",

		":slug": "mapRoute",
		":slug/:view": "mapRoute",
		":slug/:view/:pos": "mapRoute",
    },

    initialize: function() 
    {
		var self = this;

		this.firstLoad = true;
		this.pointCollections = {};
		this.timeBasedPointCollections = {};
		this.isRendered = false;

		this.settingsVisible = true;
		this.graphVisible = false;
		this.dataLibraryVisible = false;
		this.chatVisible = false;

		this.vent = _.extend({}, Backbone.Events);
		this.vent.bind('mapViewReady', function() {
			self.initMapLayers();
		});

		_.bindAll(this, "updateMapLayer");
	 	this.vent.bind("updateMapLayer", this.updateMapLayer);

		this.isEmbedded = window != window.top;
    }, 

    mapRoute: function(slug, viewName, pos)
    {
		var mapViewName,
			mapStyle,
			center, 
			zoom;

		if (viewName) {
			this.setupRoute = viewName == 'setup';
			if (!this.setupRoute) {
				var split = viewName.split(':');
				mapViewName = split.shift();
				if (split.length) {
					mapStyle = split.shift();
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

    	console.log(slug, 'mapViewName:', mapViewName, 'mapStyle', mapStyle, 'center:', center, 'zoom:', zoom);
		this.loadAndInitMap(slug, mapViewName, center, zoom, mapStyle);
    },

    mapAdminRoute: function(slug, viewName, pos)
    {
    	this.adminRoute = true;
    	this.mapRoute(slug, viewName, pos);
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

    genMapURI: function(mapViewName, opts, admin)
    {
    	if (!mapViewName) {
			mapViewName = this.mapViewName + 
				(this.mapStyle != this.mapView.defaultMapStyle ? ':' + this.mapStyle : '');
    	}
    	var uri = ((admin || admin == undefined) && this.adminRoute ? 
    		'admin/' : '') 
    		+ this.mapInfo.publicslug + (mapViewName ? '/' + mapViewName : '');
    	if (opts) {
	    	if (opts.x != undefined && opts.y != undefined) {
		    	uri += '/%(x)s,%(y)s';
		    	if (opts.zoom != undefined) {
		    		uri += ',%(zoom)s';
		    	}
	    	}
    	}
    	return uri.format(opts);
    },

	genMapURIForVisibleArea: function(visibleMapArea)
	{
		if (!visibleMapArea) {
			var visibleMapArea = this.mapView.getVisibleMapArea();
		}
		return app.genMapURI(null, {
			x: visibleMapArea.center[0],
			y: visibleMapArea.center[1],
			zoom: visibleMapArea.zoom
		});
	},

    genPublicURL: function(forVisibleMapArea)
    {
    	return BASE_URL + (forVisibleMapArea || forVisibleMapArea == undefined ?
    		this.genMapURIForVisibleArea() 
    		: this.genMapURI(false, false, false));
    },

	loadAndInitMap: function(slug, mapViewName, center, zoom, mapStyle)
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
					self.mapInfo = data;
					self.initMapView(mapViewName, center, zoom, mapStyle);
				},
				error: function() {
					console.error('failed to load map', slug);
				}
			});
			return;
		}
		self.initMapView(mapViewName, center, zoom, mapStyle);
	},

    initMapView: function(mapViewName, center, zoom, mapStyle) 
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

		var visibleMapArea = DEFAULT_MAP_AREA;
		if (this.mapInfo.initialArea && 
			this.mapInfo.initialArea.center.length) {
				visibleMapArea.center = this.mapInfo.initialArea.center;
		}
		if (this.mapInfo.initialArea.zoom != undefined) {
			visibleMapArea.zoom = this.mapInfo.initialArea.zoom;
		}
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
		this.mapView.start(mapStyle);

		if (this.mapView.mapStyles.length) {
			this.setMapStyle(mapView.mapStyle, false);
			$('#mapStyle').show();
		} else {
			$('#mapStyle').hide();
		}		

        var snap = $('<div class="snap top" /><div class="snap right" />');
		$(mapEl).append(snap);

        this.dataInfoView = new DataInfoView({vent: this.vent});
		$(mapEl).append(this.dataInfoView.render().el);

        this.mapInfoView = new MapInfoView({vent: this.vent, mapInfo: this.mapInfo});
        this.mapInfoView.render();
		/*$(mapEl).append(this.mapInfoView.render().el);
		$(this.mapInfoView.el).hide();*/
    },

    setMapStyle: function(mapStyle, navigate)
    {
    	if (navigate || navigate == undefined) {
	    	this.vent.trigger('updateMapStyle', mapStyle);
			app.navigate(app.genMapURI(app.mapViewName + ':' + mapStyle), {trigger: false});
    	}

		$('#app').removeClass('map-style-'+this.mapStyle);
		this.mapStyle = this.mapView.mapStyle;
		$('#app').addClass('map-style-'+this.mapStyle);

		var li = [];
		for (var i = 0; i < this.mapView.mapStyles.length; i++) {
			var s = this.mapView.mapStyles[i];
			if (s != this.mapStyle) {
				li.push('<li><a href="#' + s + '" data-toggle="dropdown">' + s + '</a></li>');
			}
		}
		$('#mapStyle .dropdown-menu').html(li.join(''));
		$('#mapStyleCurrent').text(this.mapView.mapStyle);
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
    	console.log(this.setupView);
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
				this.initMapLayer(this.mapInfo.layers[i].pointCollection._id)
			}
		}
	},

	initMapLayer: function(pointCollectionId)
	{
		var self = this;

		var layer = this.getMapLayer(pointCollectionId);
		console.log('initMapLayer '+pointCollectionId, layer);

		var scope = this;
		self.vent.trigger("setStateType", 'loading');
					
		var mapArea = self.mapView.getVisibleMapArea();							
		var collectionOptions = {
			pointCollectionId: pointCollectionId, 
			mapId: app.mapInfo._id, 
			mapLayer: layer
		};

		var collection = this.pointCollections[pointCollectionId] = new MapPointCollection(collectionOptions);
		self.addDataPanelViews(pointCollectionId);

		if (layer.pointCollection.status == DataStatus.COMPLETE) {
			this.fetchMapLayer(pointCollectionId);
		} else {
			self.vent.trigger("setStateType", 'loading', collection.pointCollectionId);
			app.pollForNewPointCollection(pointCollectionId, INITIAL_POLL_INTERVAL);
			//self.vent.trigger("setStateType", 'parsing');

		}

		$('.data-info').show();

		//Fetch time based point collections for graph
		/*if (1||data.timeBased) {
			collectionOptions.urlParams = {
				t: 'w'
			};
			var collection = this.timeBasedPointCollections[pointCollectionId] = new MapPointCollection(collectionOptions);
			collection.setVisibleMapArea(self.mapView.getVisibleMapArea());
			collection.fetch({success: function(collection) {
				self.graphView.addCollection(collection);
			}});
		}*/
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

	fetchMapLayer: function(pointCollectionId)
	{
		var self = this;
		var collection = this.pointCollections[pointCollectionId];
		var layer = this.getMapLayer(pointCollectionId);
		collection.setVisibleMapArea(this.mapView.getVisibleMapArea());
		collection.fetch({success: function(collection) {
			self.mapView.addCollection(collection);
			self.vent.trigger("setStateType", 'complete', layer.pointCollection._id);
		}});
	},
	
	bindCollectionToMap: function(pointCollectionId)
	{	
		var self = this;
		$.ajax({
			type: 'POST',
			url: '/api/bindmapcollection/' + this.mapInfo._id + '/' + pointCollectionId,
			success: function(data) {
				self.mapInfo = data;
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
		$('.collapse', el).collapse('show');
	},

});

tpl.loadTemplates(['homepage', 'graph', 'setup', 'map-ol', 'map-gl', 'header',
	'sidebar','data-inspector', 'data-legend', 'chat', 'modal', 'add-data', 
	'edit-data', 'data-library', 'data-info', 'map-info-modal', 'share'],
    function () {
        app = new AppRouter();
        if (!Backbone.history.start({ pushState: true })) {
	    	$('#app').html('page not found');
        }
	});
