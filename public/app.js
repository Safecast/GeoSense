window.MapViewBase = Backbone.View.extend({

    initialize: function(options) {
		this.collections = {};
		_.bindAll(this, "setMapLocation");
		options.vent.bind("setMapLocation", this.setMapLocation);
		
		this.dataObjectArray = [];
	},

	setMapLocation: function(addr)
	{				
		var self = this;
		
		geocoder = new google.maps.Geocoder();
		geocoder.geocode( {'address': addr}, function (results, status)
			{
				if (status == google.maps.GeocoderStatus.OK)
				{
					self.setViewPort(results);
				}
				else { 	
					alert ("Cannot find " + addr + "! Status: " + status);
				}
		});
	},

	addCollection: function(id, collection)
	{
		var self = this;
		this.collections[id] = collection;
		this.collections[id].bind('reset', this.reset, this);
		this.collections[id].bind('add', this.addOne, this);
		this.collections[id].fetch();		
		
		//Save to local array for UI states not saved in DB
		//I.e., visibility
		collection.visible = true;
		this.dataObjectArray.push(collection);
	},

	cleanPointModel: function(model) {
		//If location is a single string, parse it
		var input = model.get('location');
		var latlngStr = input.split(/[, ]/, 2);
		var lat = parseFloat(latlngStr[0]);
		var lng = parseFloat(latlngStr[1]);
		model.set('lat', lat);
		model.set('lon', lng);
	},

    addAll: function() {
		this.addCollectionToMap(this.collection);
    },

	reset: function(model) {
		this.removeCollectionFromMap(model);
		this.addCollectionToMap(this.collections[model.collectionId]);
	},

	addCollectionToMap: function(collection)
	{
		var self = this;
				
		//Create specific layer
		this.addCollectionAsLayer(collection);
		
		var currCollection = collection.collectionId;
		var currIndex;
		$.each(this.layerArray, function(index, value) { 
			if(value.collectionId == currCollection)
				currIndex = index;
		});
				
		collection.each(function(model) {
			self.cleanPointModel(model);
			self.addOne(model, currIndex);
		});
		
		this.layerArray[currIndex].redraw();
		
	}
});

var AppRouter = Backbone.Router.extend({

    routes:{
		":mapId/globe":"setUniqueGlobe",
		":mapId/map":"setUniqueMap",
		":mapId/setup":"setNewMap",
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
        $('body').append(this.headerView.render().el);

		this.sideBarView = new SideBarView({vent: this.vent, page: 'map'});
        $('body').append(this.sideBarView.render().el);

		this.chatView = new ChatView({vent: this.vent});
        $('body').append(this.chatView.render().el);

		this.fetchCollections('sidebar');
		
		this.vent.trigger("setToggleStates", {state:state});
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
		$('body').empty();
		this.setFromUniqueMapId({mapId:uniqueMapId, state:'map'});
	},
	
	setUniqueGlobe: function(uniqueMapId)
	{
		this.setFromUniqueMapId({mapId:uniqueMapId, state:'mapgl'});
	},
	
	setFromUniqueMapId: function(options)
	{
		var self = this;

		//Fetch map information
		$.ajax({
			type: 'GET',
			url: '/api/map/' + options.mapId,
			success: function(data) {
				_mapName = data[0].name;
				_mapId = options.mapId;
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
	},
	
	home:function () {
		
		if(_firstLoad)
		{
			_firstLoad = false;
			this.homepageView = new HomepageView();
	        $('body').append(this.homepageView.render().el);
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
			$('body').append(this.mapView.render().el);
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
			$('body').append(this.mapView.render().el);
			this.mapView.start();
        }

		this.fetchCollections('mapdata');
    },

	fetchCollections: function(type)
	{
		var self = this;
				
		//Gather distinct collections
		//This returns an array containing collectionid for lookup
		$.ajax({
			type: 'GET',
			url: '/api/maps/' + _mapId,
			success: function(data) {
		
				//Save collection information to app scope
				_mapCollections = data;
				
				//Save the distinct collection Id(s) to app scope
				num_data_sources = _mapCollections.length;
				
				//Bind existing data sources
				for(i=0;i<num_data_sources;i++)
				{
					// For each distinct data source, add an existing data source to the app.
					// This binds a data model and sidebar data view
					self.addExistingDataSource(data[i].collectionid, type);
				}				
			},
			error: function() {
				console.error('failed to fetch distinct collections');
			}
		});
	},
	
	addExistingDataSource: function(index, type)
	{
		var self = this;
		
		//First we look up the pointcollection for name & collectionid
		$.ajax({
			type: 'GET',
			url: '/api/pointcollection/' + index,
			success: function(data) {
				var name = data[0].name;
				//Now look up all points related to this collectionid
				$.ajax({
					type: 'GET',
					url: '/api/collection/' + index,
					success: function(data) {
						var scope = this;
						scope.index = index;
						
						pointCollection[this.index] = new PointCollection({
							collectionId:index,
							newData:false,
						});
						pointCollection[this.index].fetch({success: function() {
							
							//Add a new sidebar data view once data is fetched
							if(type == 'sidebar')
							{
								self.addSideBarDataView({collectionId:scope.index,dataLength:data.length,title:name});
							} else if(type == 'mapdata')
							{
								self.addMapCollection(scope.index, pointCollection[scope.index]);
							} else if(type == 'all')
							{
								self.addMapCollection(scope.index, pointCollection[scope.index]);
								self.addSideBarDataView({collectionId:scope.index,dataLength:data.length,title:name});		
							}
						}});
						
					},
					error: function() {
						console.error('failed to fetch existing data source');
					}
				});
			},
			error: function() {
				console.error('failed to fetch existing data source');
			}
		})	
	},

	addData:function (options)
	{
		var self = this;
		var uniqid = this.uniqId();
		var uniqueMapId = _mapId;
		var title = options.title
		var data = options.data;
		var color = options.color;
		var dataSet = [];
		var maxVal = 0;

		for(var i = 0; i < data.length; ++i)
		{
			var location = '';
			var lat = '';
			var lng = '';
			var intensity = '';
			var name = '';
			var val = '';
			

			$.each(data[i], function(key, val) { 
								
				if(key == 'Location')
				{
					location = val;
				}
				else if (key == 'lat')
				{
					lat = val;
				}
				else if (key == 'lng')
				{
					lng = val;
				}
				else if (key == 'lon')
				{
					lng = val;
				}
				else if (key == 'intensity')
				{
					intensity = val;
				}
				else if (key == 'name')
				{
					name = val;
				}

				if(intensity > maxVal)
					maxVal = intensity;	
					
			});	
				
			//Check for lat/lng location
			location = lat + ',' + lng;
			
			//Substitute intensity for val
			if(val == '')
				val = intensity;
			
			dataSet.push({'name':name,'location':location,'lat':lat,'lon':lng,'val':val});
		}
				
		//First increment total number of data sources
		num_data_sources +=1;
				
		//Create collection
		pointCollection[num_data_sources] = new PointCollection({
			collectionId:uniqid,
			mapId:uniqueMapId,
			title:title,
			maxVal: maxVal,
			newData:true,
		});
		
		//Create Points
		pointCollection[num_data_sources].addData(dataSet, function(){
			app.addExistingDataSource(uniqid, 'all');
		});
	},
	
	addTwitterData:function (options)
	{
		console.log('adding tweets');
	},
	
	addSideBarDataView:function (options) {
		
		this.sideBarDataView = new SideBarDataView({vent: this.vent,collection:pointCollection[options.collectionId], collectionId: options.collectionId, title:options.title, dataLength:options.dataLength});
		$('#accordion').append(this.sideBarDataView.render().el);
	},
	
	addMapCollection: function(id, collection)
	{
		this.mapView.addCollection(id, collection);
	},
	
	uniqId: function ()
	{
	    var newDate = new Date;
	    return newDate.getTime();
	},

});

tpl.loadTemplates(['homepage', 'map', 'map-gl', 'header','sidebar','sidebar-data', 'chat', 'modal', 'add-data', 'edit-data'],
    function () {
        app = new AppRouter();
        Backbone.history.start({ pushState: true });
});