var AppRouter = Backbone.Router.extend({

    routes: {
		"": "homeRoute",
		"removed": "homeRoute",

		"admin/:slug": "mapAdminRoute",
		"admin/:slug/:view": "mapAdminRoute",
		"admin/:slug/:view/:x,:y": "mapAdminRoute",
		"admin/:slug/:view/:x,:y/:zoom": "mapAdminRoute",

		":slug": "mapRoute",
		":slug/:view": "mapRoute",
		":slug/:view/:x,:y": "mapRoute",
		":slug/:view/:x,:y/:zoom": "mapRoute",
    },

    initialize: function() 
    {
		var self = this;

		this.firstLoad = true;
		this.pointCollections = {};
		this.timeBasedPointCollections = {};

		this.settingsVisible = false;
		this.graphVisible = false;
		this.dataLibraryVisible = false;
		this.chatVisible = false;

		this.vent = _.extend({}, Backbone.Events);
		this.vent.bind('mapViewReady', function() {
			self.initMapLayers();
		});

		var embed = this.getURLParameter('embed');
		if (embed == 1) {
			console.log('embed: ' + embed);
			this.renderAsEmbed();
		}
    }, 

    mapRoute: function(slug, view, x, y, zoom)
    {
		var mapView;
		if (view) {
			this.setupRoute = view == 'setup';
			if (!this.setupRoute) {
				mapView = view;
			} else {
				$('#app').empty();
			}
		}
		var center;
		if (x != undefined && y != undefined) {
			x = parseFloat(x);
			y = parseFloat(y);
			if (!isNaN(x) && !isNaN(y)) {
				center = [x, y];
			}
		}

    	console.log(slug, 'mapView:', mapView, 'center:', center, 'zoom:', zoom);
		this.loadAndInitMap(slug, mapView, center, zoom);
    },

    mapAdminRoute: function(slug, view, x, y, zoom)
    {
    	this.adminRoute = true;
    	this.mapRoute(slug, view, x, y, zoom);
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

    genMapURI: function(view, opts, admin)
    {
    	var uri = ((admin || admin == undefined) && this.adminRoute ? 
    		'admin/' : '') 
    		+ this.mapInfo.publicslug + (view ? '/' + view : '');
    	if (opts) {
	    	if (opts.x != undefined) {
		    	uri += '/%(x)s,%(y)s';
	    	}
	    	if (opts.zoom != undefined) {
	    		uri += '/%(zoom)s';
	    	}
    	}
    	return uri.format(opts);
    },

    genPublicURL: function()
    {
    	return BASE_URL + app.genMapURI(false, false, false);
    },

    initMapView: function(mapView, center, zoom) 
    {
		var self = this;
			
		if (this.mapView) {
			this.mapView.remove();
			this.mapView = null;
		}

		switch (mapView) {
			case 'map':
				var viewClass = MapOLView;
				break;
			case 'globe':
				var viewClass = MapGLView;
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
		this.mapView.uriViewName = mapView;

		var mapEl = this.mapView.render().el;
		$('#app').append(mapEl);
		this.mapView.start();

        var snap = $('<div class="snap top" /><div class="snap right" />');
		$(mapEl).append(snap);

        this.dataInfoView = new DataInfoView({vent: this.vent});
		$(mapEl).append(this.dataInfoView.render().el);

        this.mapInfoView = new MapInfoView({vent: this.vent, mapInfo: this.mapInfo});
        this.mapInfoView.render();
		/*$(mapEl).append(this.mapInfoView.render().el);
		$(this.mapInfoView.el).hide();*/
    },

    showMapInfo: function() 
    {
		//$(this.mapInfoView.el).show();
		this.mapInfoView.show();
    },

    showAbout: function() 
    {
		var modalView = new ModalView().render();
		modalView.setTitle('About GeoSense');
		modalView.setBody(nl2p('GeoSense is an open publishing platform for visualization, social sharing, and data analysis of geospatial data. It explores the power of data analysis through robust layering and highly customizable data visualization. GeoSense supports the simultaneous comparison and individual styling for multiple massive data sources ranging from 10 thousand to 10 million geolocated points.'
				+ '\n\nDeveloped by Anthony DeVincenzi and Samuel Luescher of the MIT Media Lab, alongside Hiroshi Ishii and Safecast.org.'));
		modalView.show();
    },
	
	isMapAdmin: function()
	{
		return this.adminRoute && this.mapInfo.admin; 
	},

	render: function(mapView) 
	{
		var self = this;

		window.document.title = this.mapInfo.title + ' – GeoSense';

 		this.headerView = new HeaderView({vent: this.vent, mapInfo: this.mapInfo});
        $('#app').append(this.headerView.render().el);

		this.sideBarView = new SideBarView({vent: this.vent, mapView: mapView});
        $('#app').append(this.sideBarView.render().el);

		//this.chatView = new ChatView({vent: this.vent});
        //$('#app').append(this.chatView.render().el);

		//this.graphView = new GraphView({vent: this.vent});
		//$('#app').append(this.graphView.render().el);
		
		$('body').css("overflow","hidden");

		// TODO: Detect embed 
		if (window.location.href.indexOf('4D4R0IjQJYzGP0m') != -1) {
			$('body').addClass("embed");
		}
		
		//this.addCommentData();
		
		this.vent.trigger("setToggleStates", {mapView: mapView});
		
		if (this.isMapAdmin()) {
			this.setupView = new SetupView({vent: this.vent, mapInfo: this.mapInfo});
			$('#app').append(this.setupView.render().el);
			if (this.setupRoute) {
				$('#setupModal').modal('show');	
			}
		}
	},

	renderAsEmbed: function()
	{
		var link = $("<link>");
		link.attr({
        	type: 'text/css',
        	rel: 'stylesheet',
        	href: '/styles/embed.css'
		});
		$("head").append( link ); 

		console.log("Rendering GeoSense map as embed...")
		$('.map-gl-view').addClass('full');
		$('.message').addClass('.embed');
	},

	loadAndInitMap: function(slug, mapView, center, zoom)
	{
		var self = this;
		$.ajax({
			type: 'GET',
			url: '/api/map/' + slug,
			success: function(data) {
				self.mapInfo = data;
				switch (mapView) {
					default:
						mapView = 'map';
						break;
					case 'map':
						break;
					case 'globe':						
						break;
				}

				self.initMapView(mapView, center, zoom);

				if (!self.sideBarView) {
					self.render(mapView);
				}
			},
			error: function() {
				console.error('failed to load map', slug);
			}
		});
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

		layer.pointCollection.collectionId = layer.pointCollection.collectionid = pointCollectionId; // TODO: deprecated
					
		var mapArea = self.mapView.getVisibleMapArea();							
		var collectionOptions = {
			pointCollectionId: pointCollectionId, 
			mapId: app.mapInfo._id, 
			mapLayer: layer
		};

		var collection = this.pointCollections[pointCollectionId] = new PointCollection(collectionOptions);
		self.addDataPanelViews(pointCollectionId);

		if (layer.pointCollection.status == DataStatus.COMPLETE) {
			this.fetchMapLayer(pointCollectionId);
		} else {
			self.vent.trigger("setStateType", 'loading', collection);
			app.pollForNewPointCollection(pointCollectionId, INITIAL_POLL_INTERVAL);
			//self.vent.trigger("setStateType", 'parsing');

		}

		$('.data-info').show();

		//Fetch time based point collections for graph
		/*if (1||data.timeBased) {
			collectionOptions.urlParams = {
				t: 'w'
			};
			var collection = this.timeBasedPointCollections[pointCollectionId] = new PointCollection(collectionOptions);
			collection.setVisibleMapArea(self.mapView.getVisibleMapArea());
			collection.fetch({success: function(collection) {
				self.graphView.addCollection(collection);
			}});
		}*/
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
			this.vent.trigger("setStateType", 'loading', layer.pointCollection);
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
			self.vent.trigger("setStateType", 'complete', layer.pointCollection);
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
	
	addCommentData: function(options)
	{		
		this.commentCollection = new CommentCollection({});
		this.mapView.addCommentCollection(this.commentCollection);
	},
	
	addTwitterData: function (options)
	{
		console.log('adding tweets');
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
	'edit-data', 'data-library', 'data-info', 'map-info-modal'],
    function () {
        app = new AppRouter();
        if (!Backbone.history.start({ pushState: true })) {
	    	$('#app').html('page not found');
        }
	});
