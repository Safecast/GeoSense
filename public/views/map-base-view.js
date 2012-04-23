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

	/**
	* Required to be implemented by descendants.
	*/
	getVisibleMapArea: function()
	{
		return {
			bounds: null,
			zoom: null
		};
	},
	
	mapAreaChanged: function(visibleMapArea)
	{
		$.each(this.collections, function(collectionid, collection) { 
			collection.setVisibleMapArea(visibleMapArea);
			collection.fetch();
		});

		this.vent.trigger("updateGraphCollections", visibleMapArea);

		//TODO: Update graph collections
	},

	addCollection: function(collection)
	{	
		console.log('addCollection');

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
	
	addCommentCollection: function(collection)
	{
		var self = this;
		this.commentCollection = collection;
		this.commentCollection.bind('reset', this.resetComments, this);
		this.commentCollection.bind('add', this.addOneComment, this);
		this.commentCollection.fetch();
	},

    addAll: function() {	
		this.addCollectionToMap(this.collection);
    },

	reset: function(model) {
		this.removeCollectionFromMap(model);
		if (model.length > 0) {
			this.addCollectionToMap(this.collections[model.collectionId]);
		}
	},

	resetComments: function(model) {
		//this.removeCollectionFromMap(model);
		this.addCommentToMap(model);
	},

	addCollectionToMap: function(collection)
	{
		var self = this;
		collection.each(function(model) {
			self.addOne(model, collection.collectionId);
		});
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
