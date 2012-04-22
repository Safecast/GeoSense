window.MapViewBase = Backbone.View.extend({

    initialize: function(options) {
		this.collections = {};
		this.layerArray = {};
		this.vent = options.vent;
		_.bindAll(this, "setMapLocation");
		options.vent.bind("setMapLocation", this.setMapLocation);  
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
	
	mapPositionChanged: function(zoom, bounds)
	{
		//Bounds are [[SE.x, SE.y],[NW.x, NW.y]]
		$.each(this.collections, function(key, val) { 
			switch(zoom) {
				case 0:
				break
				case 1:
					val.url = '/api/collection/1335042230';
					val.fetch();
				break
				case 2:
				break
				default:
				break
			}
		});
	},

	addCollection: function(collection)
	{		
		var self = this;
		$.ajax({
			type: 'GET',
			url: '/api/map/' + _mapId,
			success: function(data) {
				var scope = this;
				$.each(data[0].collections, function(key, link) { 
					if (link.collectionid == collection.collectionId) {
						//scope.ajaxCollection.params = parameterCollection;
						
						collection.params = link.defaults;
						self.collections[link.collectionid] = collection;

						self.collections[link.collectionid].bind('reset', self.reset, self);
						self.collections[link.collectionid].bind('add', self.addOne, self);
						self.addCollectionToMap(self.collections[link.collectionid]);
						self.vent.trigger("setStateType", 'complete');
						

					}	
				});
				
			},
			error: function() {
				console.error('failed to fetch map collection');
			}
		});
		
	},
	
	fetchParameters: function()
	{
		var self = this;
		$.ajax({
			type: 'GET',
			url: '/api/map/' + _mapId,
			success: function(data) {
				
				$.each(data[0].collections, function(key, collection) { 
					$.each(collection, function(key, val) { 
						if(key == 'collectionid')
						{
							if(self.collectionId == val)
								self.setParameters(collection);
								_boundCollections[self.collectionId] = collection;
						}	
					});
				});
				
			},
			error: function() {
				console.error('failed to fetch map collection');
			}
		});
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
		
		if(!this.layerArray[collection.collectionId])
		{
			delete this.addCollectionAsLayer(collection);
		}
		
		this.addCollectionAsLayer(collection);
		
		collection.each(function(model) {
			self.cleanPointModel(model);
			self.addOne(model, collection.collectionId);
		});
			
		this.layerArray[collection.collectionId].redraw();
	 
		this.vent.trigger("setStateType", 'complete');	
	},
	
	updateFromNewCollection: function(collection)
	{
		
	},
	
	addCommentToMap: function(collection)
	{
		var self = this;
		collection.each(function(model) {
			self.addOneComment(model);
		});
	}
});
