var AppRouter = Backbone.Router.extend({

    routes: {
/*		":slug/globe": "routeGlobe",
		":slug/globe/": "routeGlobe",
		":slug/map": "routeMap",
		":slug/map/": "routeMap",
		":slug/map/:query": "routeMap",
		":slug/globe/:query": "routeGlobe",
		":slug/setup": "routeNewMap",
		":slug/": "routeMap",
		":slug": "routeMap",
		"removed": "home",
		"":"home",*/
    },

    initialize:function() {
		var self = this;

		var router = this,
			routes = [
				[/^(admin\/)?([a-zA-Z0-9\-\_]+)(|\/globe|\/map|\/setup)\/?(\?.*)?$/, 'mainRoute'],
				['removed', 'homeRoute'],
				['', 'homeRoute']
			];

		_.each(routes, function(route) {
			router.route.apply(router, route);
		});

		this.vent = _.extend({}, Backbone.Events);
		this.vent.bind('mapViewReady', function() {
			self.initMapLayers();
		});

		var embed = this.getURLParameter('embed');
		if(embed == 1)
		{
			console.log('embed: ' + embed);

			this.renderAsEmbed();
		}
    }, 

	mainRoute: function(admin, slug, view, query)
	{
		var mapView = '';
		if (view) {
			view = view.split('/')[1];
			this.setupRoute = view == 'setup';
			if (!this.setupRoute) {
				mapView = view;
			} else {
				$('#app').empty();
			}
		}
		this.adminRoute = admin;
		console.log('mainRoute', slug, mapView, query);
		this.loadAndInitMap(slug, mapView);
	},

	homeRoute: function () {
		
		if(_firstLoad) {
			_firstLoad = false;
			this.homepageView = new HomepageView();
	        $('#home').append(this.homepageView.render().el);
		} else {
			window.location.reload(true);			
		}
	},

    initMapView: function(mapView) {
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
		
        this.mapView = new viewClass({
			vent: self.vent
		});

		var mapEl = this.mapView.render().el;
		$('#app').append(mapEl);
		this.mapView.start();

        var snap = $('<div class="snap top" /><div class="snap right" />');
		$(mapEl).append(snap);

        this.dataInfoView = new DataInfoView({vent: this.vent});
		$(mapEl).append(this.dataInfoView.render().el);
    },
	
	isMapAdmin: function()
	{
		return this.adminRoute && this.mapInfo.admin; 
	},

	render: function(mapView) {

		var self = this;

		window.document.title = this.mapInfo.title + ' – GeoSense';

 		this.headerView = new HeaderView({vent: this.vent, title: this.mapInfo.title});
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
        	href: 'styles/embed.css'
		});
		$("head").append( link ); 

		console.log("Rendering GeoSense map as embed...")
		$('.map-gl-view').addClass('full');
		$('.message').addClass('.embed');
	},

	loadAndInitMap: function(slug, mapView)
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

				self.initMapView(mapView);

				if (!self.sideBarView) {
					self.render(mapView);
				}
			},
			error: function() {
				console.error('failed to load map', slug);
			}
		});
	},

	getURLParameter:function(name) {
	    return decodeURI(
	        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
	    );
	},

	pollForNewPointCollection: function(pointCollectionId, interval) {
		if (interval) {
			setTimeout(function() {
				app.pollForNewPointCollection(pointCollectionId);
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
		    	if (data.status == DataStatus.IMPORTING || data.status == DataStatus.REDUCING) {
					app.vent.trigger("setStateType", 'parsing', data);
					console.log('Collection '+pointCollectionId+' is busy, polling again after timeout...');
					app.pollForNewPointCollection(pointCollectionId, POLL_INTERVAL);					
		    	} else {
					app.bindCollectionToMap(pointCollectionId);
					app.vent.trigger("setStateType", 'post');
		    	}
		    }
		});

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

		//Fetch point collections for map(s)

		var collection = pointCollection[pointCollectionId] = new PointCollection(collectionOptions);
		collection.setVisibleMapArea(self.mapView.getVisibleMapArea());
		collection.fetch({success: function(collection) {
 			self.addDataPanelViews(pointCollectionId);
			self.mapView.addCollection(collection);
			console.log('complete');
			self.vent.trigger("setStateType", 'complete', layer.pointCollection);
		}});

		$('.data-info').show();

		//Fetch time based point collections for graph
		/*if (1||data.timeBased) {
			collectionOptions.urlParams = {
				t: 'w'
			};
			var collection = timeBasedPointCollection[pointCollectionId] = new PointCollection(collectionOptions);
			collection.setVisibleMapArea(self.mapView.getVisibleMapArea());
			collection.fetch({success: function(collection) {
				self.graphView.addCollection(collection);
			}});
		}*/
			
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
			collection: pointCollection[pointCollectionId], 
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

tpl.loadTemplates(['homepage', 'graph', 'setup', 'map-ol', 'map-gl', 'header','sidebar','data-inspector', 'data-legend', 'chat', 'modal', 'add-data', 'edit-data', 'data-library', 'data-info'],
    function () {
        app = new AppRouter();
        Backbone.history.start({ pushState: true });
});