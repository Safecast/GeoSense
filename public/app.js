window.MapViewBase = Backbone.View.extend({

    initialize: function(options) {
		this.collections = {};
		_.bindAll(this, "setMapLocation");
		options.vent.bind("setMapLocation", this.setMapLocation);			
	},

	setMapLocation: function(addr)
	{				
		var self = this;
		
		geocoder = new google.maps.Geocoder();
		geocoder.geocode( {'address': addr, 'region': "jp"}, function (results, status)
			{
				if (status == google.maps.GeocoderStatus.OK)
				{
					self.fitMapBounds(results[0].geometry.viewport);
				}
				else { 	
					alert ("Cannot find " + addr + "! Status: " + status);}
		});
	},

	addCollection: function(id, collection)
	{
		var self = this;
		this.collections[id] = collection;
		this.collections[id].bind('reset', this.reset, this);
		this.collections[id].bind('add', this.addOne, this);
		this.collections[id].fetch();
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
		collection.each(function(model) {
			self.cleanPointModel(model);
			self.addOne(model);
		});
	}

});

var AppRouter = Backbone.Router.extend({

    routes:{
		"globe":"mapGL",
		"map":"map",
        ":mapId":"setFromUniqueMapId",
		"":"home",
    },

    initialize:function() {
		var self = this;
		this.vent = _.extend({}, Backbone.Events);
    },

	render:function()
	{
 		this.headerView = new HeaderView({vent: this.vent, mapName:_mapName});
        $('body').append(this.headerView.render().el);

		this.sideBarView = new SideBarView({vent: this.vent, page: 'map'});
        $('body').append(this.sideBarView.render().el);

		this.fetchAndDrawData('all');	
	},

	setUniqueMapName: function(name)
	{
		_mapName = name;		
	},
	
	setFromUniqueMapId: function(uniqueMapId)
	{
		var self = this;
		
		//Fetch map information
		$.ajax({
			type: 'GET',
			url: '/api/map/' + uniqueMapId,
			success: function(data) {
				_mapName = data[0].name;
				_mapId = uniqueMapId;
				self.map();
			},
			error: function() {
				console.error('failed to fetch unique map');
			}
		});
	},
	
	home:function () {
		$('body').empty();
		this.homepageView = new HomepageView();
        $('body').append(this.homepageView.render().el);
	},

    map:function () {
		var self = this;
		
		if(!this.sideBarView)
		self.render();
		
		if(this.mapView)
		{
			this.mapView.remove();
			this.mapView = null;
		}
		
	    if (!this.mapView)
		{
            this.mapView = new MapView({
				vent: self.vent
			});
			$('body').append(this.mapView.render().el);
			this.mapView.start();
        }

		this.vent.trigger("setToggleStates", {state:'map'});
		
		if(!firstLoad)
		{
			this.fetchAndDrawData('map');
		} else
		{
			firstLoad = false;
		}	
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
				collection: this.readingsCollection,
				vent: self.vent
			});
			$('body').append(this.mapView.render().el);
			this.mapView.start();
        }

		this.vent.trigger("setToggleStates", {state:'mapgl'});
		
		if(!firstLoad)
		{
			this.fetchAndDrawData('map');
		} else
		{
			firstLoad = false;
		}
    },

	fetchAndDrawData: function(loadType)
	{
		var self = this;
				
		//Gather distinct collections
		//This returns an array containing collectionid for lookup
		$.ajax({
			type: 'GET',
			url: '/api/maps/' + _mapId,
			success: function(data) {
		
				console.log(data);
				//Save the distinct collection Id(s) to app scope
				num_data_sources = data.length;
				
				for(i=0;i<num_data_sources;i++)
				{
					// For each distinct data source, add an existing data source to the app.
					// This binds a data model and sidebar data view
					self.addExistingDataSources(data[i].collectionid, loadType);
				}
			},
			error: function() {
				console.error('failed to fetch distinct collections');
			}
		});
	},

	maxValue: function( array ){
	    return Math.max.apply( Math, array );
	},
	
	uniqId: function ()
	{
	    var newDate = new Date;
	    return newDate.getTime();
	},

	addData:function (options)
	{
		var self = this;
		var uniqid = this.uniqId();
		var uniqueMapId = _mapId;
		var title = options.title
		var data = options.data;
		var color = options.color;
		
		//First increment total number of data sources
		num_data_sources +=1;
		
		console.log('uniqueMapId: ' + uniqueMapId);
		
		//Create collection
		pointCollection[num_data_sources] = new PointCollection({
			collectionId:uniqid,
			mapId:uniqueMapId,
			title:title,
			newData:true,
		});

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
				else if (key == 'intensity')
				{
					intensity = val;
				}
				else if (key == 'name')
				{
					name = val;
				}
			});	
			
			//Check for lat/lng location
			if(location == '')
				location = lat + ',' + lng;
			
			//Substitute intensity for val
			if(val == '')
				val = intensity;
			
			pointCollection[num_data_sources].create({name:name,location:location,lat:lat,lon:lng,val:val,color:color});
			//console.log('location: ' + location + ' lat: ' + lat + ' lng: ' + lng + ' intensity: ' + intensity + ' name: ' + name);
		}
		
		//Activate data toggles in adddata view
		self.vent.trigger("toggleAddDataToolTips",pointCollection[num_data_sources]);
		
		//Append a new side bar view
		self.addSideBarDataView({collectionId:num_data_sources,title:title});
		
		//If MapView, add new markers
		self.addMapCollection(uniqid, pointCollection[num_data_sources]);		
			
	},
	
	addExistingDataSources: function(index, loadType)
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
							
							if(loadType == 'all')
								self.addSideBarDataView({collectionId:scope.index,dataLength:data.length,title:name});
								
							self.addMapCollection(scope.index, pointCollection[scope.index]);	
							
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
	
	addTwitterData:function (options)
	{
		console.log('adding tweets');
	},
	
	addSideBarDataView:function (options) {
		//Add SideBar
		this.sideBarDataView = new SideBarDataView({collection:pointCollection[options.collectionId], collectionId: options.collectionId, title:options.title});
		$('#accordion').append(this.sideBarDataView.render().el);
	},
	
	addMapCollection: function(id, collection)
	{
		this.mapView.addCollection(id, collection);
	},

});

tpl.loadTemplates(['homepage', 'map', 'map-gl', 'header','sidebar','sidebar-data', 'modal','add-data','edit-data'],
    function () {
        app = new AppRouter();
        Backbone.history.start({ pushState: true });
});