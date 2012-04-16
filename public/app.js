window.MapViewBase = Backbone.View.extend({

    initialize: function(options) {
		this.collections = {};
		this.vent = options.vent;
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
		
		this.addCollectionToMap(this.collections[id]);
	},
	
	addCommentCollection: function(collection)
	{
		var self = this;
		this.commentCollection = collection;
		this.commentCollection.bind('reset', this.resetComments, this);
		this.commentCollection.bind('add', this.addOneComment, this);
		this.commentCollection.fetch();
	},

	cleanPointModel: function(model) {
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
		if(model.length > 0)
			this.addCollectionToMap(this.collections[model.collectionId]);
	},

	resetComments: function(model) {
		//this.removeCollectionFromMap(model);
		this.addCommentToMap(model);
	},

	addCollectionToMap: function(collection)
	{
		var self = this;
		this.vent.trigger("setStateType", 'drawing');
		
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
		
		if(_loaded_data_sources == (_num_data_sources-1))
			this.vent.trigger("setStateType", 'complete');	
	},
	
	addCommentToMap: function(collection)
	{
		var self = this;
		collection.each(function(model) {
			self.addOneComment(model);
		});
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
        $('#app').append(this.headerView.render().el);

		this.sideBarView = new SideBarView({vent: this.vent, page: 'map'});
        $('#app').append(this.sideBarView.render().el);

		this.chatView = new ChatView({vent: this.vent});
        $('#app').append(this.chatView.render().el);

		this.setupView = new SetupView({vent: this.vent, mapId:_mapId, mapName:_mapName});
		$('#app').append(this.setupView.render().el);
		
		this.graphView = new GraphView({vent: this.vent});
		$('body').append(this.graphView.render().el);
		//$('body').append(this.graphView.drawGraph());
		$('.graph-view').addClass('visible');
		$('.header-view .graph').addClass('active');
		
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
		var collectionObject = ["Hello","World"];
		$.ajax({
			type: 'GET',
			url: '/api/map/' + _mapId,
			success: function(data) {
		
				if(data[0].collections)
				{
					_mapCollections = data[0].collections;
				
					for(var i = 0; i < _mapCollections.length; ++i)
					{
						$.ajax({
							type: 'GET',
							url: '/api/pointcollection/' + _mapCollections[i],
							success: function(data) {
								self.addExistingDataSource(data[0].collectionid, type)
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
	
	addExistingDataSource: function(index,type)
	{
		var self = this;
		
		$.ajax({
			type: 'GET',
			url: '/api/pointcollection/' + index,
			success: function(data) {
				
				self.vent.trigger("setStateType", 'loading');

				var mapId = data[0].mapid;
				var maxVal = data[0].maxval;
				var minVal = data[0].minval;
				var name = data[0].name;
												
				pointCollection[index] = new PointCollection({collectionId:index, mapId:mapId, maxVal:maxVal, minVal:minVal, name:name, newData:false});
				
				pointCollection[index].fetch({success: function(data) {
					
					self.vent.trigger("setStateType", 'complete');
					
					if(_firstLoad == true || type == 'newData' || type == 'dataLibrary')
					{
			 			self.addSideBarDataView({collectionId:index,dataLength:data.length,title:name});
					}
								
					self.addMapCollection(index, pointCollection[index]);
					
					self.addGraphCollection(index, pointCollection[index]);
					
					_loaded_data_sources += 1;
					if(_loaded_data_sources == _num_data_sources)
						_firstLoad = false;
											
				}});
					
			},
			error: function() {
				console.error('failed to fetch existing data source');
			}
		});
	},
	
	addFromDataLibrary: function(collectionId)
	{
		$.ajax({
			type: 'POST',
			url: '/api/bindmapcollection/'+_mapId+'/' + collectionId,
			success: function(data) {
				_num_data_sources+=1;
				app.addExistingDataSource(collectionId, 'dataLibrary')
			},
			error: function() {
				console.error('failed to join map with collection');
			}
		});	
	},

	addData:function (options)
	{
		var self = this;
		var uniqid = this.uniqId();
		var uniqueMapId = _mapId;
		var title = options.title
		var data = options.data;
		var colorLow = options.colorLow;
		var colorHigh = options.colorHigh;
		var dataSet = [];
		var maxVal = 0;
		var minVal;

		for(var i = 0; i < data.length; ++i)
		{
			var location = '';
			var lat = '';
			var lng = '';
			var intensity = '';
			var name = '';
			var val = '';
			var date = '';
			var day = '';
			var month = '';
			var year = '';
			
			$.each(data[i], function(key, val) { 
								
				if(key == 'Location')
				{
					location = val;
				}
				if(key == 'location')
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
				else if (key == 'intensity' || key == 'value')
				{
					intensity = val;
				}
				else if (key == 'name' || key == 'title')
				{
					name = val;
				}
				else if (key == 'color')
				{
					color = val;
				}
				else if (key == 'date')
				{
					date = val;
				}
				else if (key == 'day')
				{
					day = val;
				}
				else if (key == 'month')
				{
					month = val;
				}
				else if (key == 'year')
				{
					year = val;
				}
	
			});	
			
			//Format date
			if(date == '')
			{
				if(day != '' && month != '' & year != '')
				{	
					var d = Date.UTC(year,month,day);
					date =  d;		
				}
			}
			
			//Check for lat/lng location
			if(location == '')
				location = lat + ',' + lng;
				
			if(lat == '' && lng == '')
			{
				var latlngStr = location.split(/[, ]/, 2);
				lat = parseFloat(latlngStr[0]);
				lng = parseFloat(latlngStr[1]);	
			}
			
			//Substitute intensity for val
			if(val == '')
				val = intensity;
			
			if(val >= maxVal)
				maxVal = val;	
				
			if(minVal == undefined)
				minVal = val;
			
			if(val <= minVal)
				minVal = val;
						
			//Substitute intensity for val
			if(val == '')
				val = 10;

			dataSet.push({'name':name,'location':location,'lat':lat,'lon':lng,'val':val, 'date':date, 'colorlow':colorLow, 'colorhigh':colorHigh});
		}
				
		//First increment total number of data sources
		_num_data_sources +=1;
		
		if(maxVal == '')
			maxVal = 1;
		
		if(minVal == '')
			minVal = 0;
		
		//Create collection
		pointCollection[_num_data_sources] = new PointCollection({
			collectionId:uniqid,
			mapId:uniqueMapId,
			title:title,
			maxVal: maxVal,
			minVal: minVal,
			newData:true,
		});
				
		//Create Points
		pointCollection[_num_data_sources].addData(dataSet, function(){
			app.addExistingDataSource(uniqid, 'newData');
		});
		
		$('#addDataModal').modal('hide');
		this.vent.trigger("setStateType", 'post');
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
	
	addSideBarDataView:function (options) {
		this.sideBarDataView = new SideBarDataView({vent: this.vent,collection:pointCollection[options.collectionId], collectionId: options.collectionId, title:options.title, dataLength:options.dataLength});
		$('#accordion').append(this.sideBarDataView.render().el);
	},
	
	addMapCollection: function(id, collection)
	{
		this.mapView.addCollection(id, collection);
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