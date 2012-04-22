var AppRouter = Backbone.Router.extend({

    routes:{
		":mapId/globe":"setUniqueGlobe",
		":mapId/globe/":"setUniqueGlobe",
		":mapId/map":"setUniqueMap",
		":mapId/map/":"setUniqueMap",
		":mapId/globe/:query":"setUniqueGlobe",
		":mapId/setup":"setNewMap",
		":mapId/":"setUniqueMap",
		":mapId":"setUniqueMap",
		"removed":"home",
		"":"home",
    },

    initialize:function() {
		var self = this;
		this.vent = _.extend({}, Backbone.Events);
    }, 

	render:function(state)
	{
 		this.headerView = new HeaderView({vent: this.vent, mapName:_mapName});
        $('#app').append(this.headerView.render().el);

		this.sideBarView = new SideBarView({vent: this.vent, page: 'map'});
        $('#app').append(this.sideBarView.render().el);

		this.chatView = new ChatView({vent: this.vent});
        $('#app').append(this.chatView.render().el);

		this.setupView = new SetupView({vent: this.vent, mapId:_mapId, mapAdminId:_mapAdminId, mapName:_mapName});
		$('#app').append(this.setupView.render().el);
		
		this.graphView = new GraphView({vent: this.vent});
		$('#app').append(this.graphView.render().el);
		
		$('body').css("overflow","hidden");
		
		this.addCommentData();
		
		this.vent.trigger("setToggleStates", {state:state});
		
		if(_setupRoute)
			$('#setupModal').modal('show');	
	},

	setUniqueMapName: function(name)
	{
		_mapName = name;		
	},
	
	setUniqueMap: function(uniqueMapId)
	{
		this.setFromUniqueMapId({mapId:uniqueMapId, state:'map'});
	},
	
	setNewMap: function(uniqueMapId)
	{
		_setupRoute = true;
		$('#app').empty();
		this.setFromUniqueMapId({mapId:uniqueMapId, state:'map'});
	},
	
	setUniqueGlobe: function(uniqueMapId)
	{
		this.setFromUniqueMapId({mapId:uniqueMapId, state:'mapgl'});
	},
	
	setFromUniqueMapId: function(options)
	{
		var self = this;
		mapIdLength = options.mapId.length;
		if(mapIdLength == 10) // Viewer Route
		{
			$.ajax({
				type: 'GET',
				url: '/api/map/' + options.mapId,
				success: function(data) {
					_admin = false;
					_mapName = data[0].title;
					_mapId = data[0].publicslug;
					if(options.state == 'map')
					{
						self.map();
					}
					else
					{
						self.mapGL();
					}

					if(!self.sideBarView)
						self.render(options.state);

				},
				error: function() {
					console.error('failed to fetch unique map');
				}
			});
			
		} else if(mapIdLength == 15) // Admin Route
		{
			$.ajax({
				type: 'GET',
				url: '/api/map/admin/' + options.mapId,
				success: function(data) {
					_admin = true;
					_mapName = data[0].title;
					_mapId = data[0].publicslug;
					_mapAdminId = data[0].adminslug;
					if(options.state == 'map')
					{
						self.map();
					}
					else
					{
						self.mapGL();
					}

					if(!self.sideBarView)
						self.render(options.state);

				},
				error: function() {
					console.error('failed to fetch unique map');
				}
			});
		}
	},
	
	home:function () {
		
		if(_firstLoad)
		{
			_firstLoad = false;
			this.homepageView = new HomepageView();
	        $('#home').append(this.homepageView.render().el);
		} else
		{
			window.location.reload(true);			
		}
	},

    map:function () {
		var self = this;
			
		if(this.mapView)
		{
			this.mapView.remove();
			this.mapView = null;
		}
		
	    if (!this.mapView)
		{
            this.mapView = new MapOLView({
				vent: self.vent
			});
			$('#app').append(this.mapView.render().el);
			this.mapView.start();
        }	

		this.fetchCollections('mapdata');
    },

	mapGL:function () {
		var self = this;
				
		if(this.mapView)
		{
			this.mapView.remove();
			this.mapView = null;
		}
				
	    if (!this.mapView)
		{			
            this.mapView = new MapGLView({
				vent: self.vent
			});
			$('#app').append(this.mapView.render().el);
			this.mapView.start();
        }

		this.fetchCollections('mapdata');
    },	

	fetchCollections: function(type)
	{
		var self = this;
		$.ajax({
			type: 'GET',
			ajaxType: type,
			url: '/api/map/' + _mapId,
			success: function(data) {
				var scope = this;
				if(data[0].collections)
				{
					_mapCollections = data[0].collections;
				
					for(var i = 0; i < _mapCollections.length; ++i)
					{						
						$.ajax({
							type: 'GET',
							ajaxI: i,
							url: '/api/pointcollection/' + _mapCollections[i].collectionid,
							success: function(data) {

								self.addExistingDataSource(data.collectionid, scope.ajaxType)
							},
							error: function() {
								console.error('failed to fetch distinct collections');
							}
						});
					}
					//Save the distinct collection Id(s) to app scope
					_num_data_sources = _mapCollections.length;
				}
			},
			error: function() {
				console.error('failed to fetch distinct collections');
			}
		});
	},
	
	pollForNewPointCollection: function(pointCollectionId) {
		console.log('pollForNewPointCollection: '+pointCollectionId);
		$.ajax({
			type: 'GET',
			url: '/api/pointcollection/' + pointCollectionId,
		    error: function() {
				console.error('Failed to fetch new collection, trying again after timeout...');
				setTimeout(function() {
					app.pollForNewPointCollection(pointCollectionId);
				}, POLL_INTERVAL);
		    },
		    success: function(data) {
				app.bindCollectionToMap(pointCollectionId);
				app.addExistingDataSource(data._id, 'newData');
				app.vent.trigger("setStateType", 'post');
		    }
		});

	},

	addExistingDataSource: function(index, type)
	{
		var self = this;
		
		$.ajax({
			type: 'GET',
			ajaxIndex: index,
			ajaxType: type,
			url: '/api/pointcollection/' + index,
			success: function(data) {
				var scope = this;
				self.vent.trigger("setStateType", 'loading');

				var mapId = _mapId;
				var maxVal = data.maxval;
				var minVal = data.minval;
				var title = data.title;
				data.collectionId = data.collectionid; // TODO: deprecated
																
				pointCollection[scope.ajaxIndex] = new PointCollection({collectionId:data.collectionId, mapId:mapId, maxVal:maxVal, minVal:minVal, name:name, newData:false});
				pointCollection[scope.ajaxIndex].fetch({success: function(data) {

					if(_firstLoad == true || scope.ajaxType == 'newData' || scope.ajaxType == 'dataLibrary')
					{
			 			self.addSideBarDataView({collectionId:data.collectionId,dataLength:data.length,title:title});
					}
								
					//self.addMapCollection(data.collectionId, pointCollection[data.collectionId]);
					self.mapView.addCollection(data);
					
					self.addGraphCollection(data.collectionId, pointCollection[data.collectionId]);
					
					_loaded_data_sources += 1;
					if(_loaded_data_sources == _num_data_sources)
						_firstLoad = false;
						
					self.vent.trigger("setStateType", 'complete');
											
				}});
					
			},
			error: function() {
				console.error('failed to fetch existing data source');
			}
		});
	},
	
	addFromDataLibrary: function(collectionId)
	{
		this.bindCollectionToMap(collectionId);
		_num_data_sources+=1;
		app.addExistingDataSource(collectionId, 'dataLibrary')
			
	},
	
	bindCollectionToMap: function(pointCollectionId)
	{	
		$.ajax({
			type: 'POST',
			url: '/api/bindmapcollection/' + _mapId + '/' + pointCollectionId,
			success: function(data) {
				
			},
			error: function() {
				console.error('failed to join map with collection');
			}
		});	
	},

	/*addData: function (options)
	{
		var self = this;
		var pointCollectionId = options.collectionId;
				
		app.addExistingDataSource(uniqid, 'newData');
		this.bindCollectionToMap(defaults);
		
		$('#addDataModal').modal('hide');
		this.vent.trigger("setStateType", 'post');
	},*/
	
	addCommentData: function(options)
	{		
		this.commentCollection = new CommentCollection({});
		this.mapView.addCommentCollection(this.commentCollection);
	},
	
	addTwitterData: function (options)
	{
		console.log('adding tweets');
	},
	
	addSideBarDataView:function (options) {
		this.sideBarDataView = new SideBarDataView({vent: this.vent,collection:pointCollection[options.collectionId], collectionId: options.collectionId, title:options.title, dataLength:options.dataLength});
		$('#accordion').append(this.sideBarDataView.render().el);
	},
	
	addGraphCollection: function(id, collection)
	{
		this.graphView.addCollection(id, collection);
	},
	
	uniqId: function ()
	{
	    var newDate = new Date;
	    return newDate.getTime();
	},

});

tpl.loadTemplates(['homepage', 'graph', 'setup', 'map', 'map-gl', 'header','sidebar','sidebar-data', 'chat', 'modal', 'add-data', 'edit-data', 'data-library'],
    function () {
        app = new AppRouter();
        Backbone.history.start({ pushState: true });
});