window.MapViewBase = Backbone.View.extend({

    initialize: function(options) {
		this.collections = {};
		this.layerArray = {};
		this.vent = options.vent;
		_.bindAll(this, "setMapLocation");
		options.vent.bind("setMapLocation", this.setMapLocation);
		
		_.bindAll(this, "redrawCollection");
		options.vent.bind("redrawCollection", this.redrawCollection);  
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
		this.vent.trigger("setStateType", 'loading');

		$.each(this.collections, function(collectionid, collection) { 
			collection.setVisibleMapArea(visibleMapArea);
			collection.fetch();
		});

		this.vent.trigger("updateGraphCollections", visibleMapArea);
	},

	redrawCollection: function(options)
	{
		var self = this;

		var collectionId = options.collectionId;
		var updateObject = options.updateObject;

		this.collections[collectionId].params.color = updateObject.color;
		this.collections[collectionId].params.colorHigh = updateObject.colorHigh;
		this.collections[collectionId].params.colorLow = updateObject.colorLow;
		this.collections[collectionId].params.colorType = updateObject.colorType;
		this.collections[collectionId].params.displayType = updateObject.displayType;
		this.collections[collectionId].params.visible = updateObject.visible;

		$.each(this.collections, function(collectionid, collection) { 
			if(collectionid == collectionId)
				collection.fetch();
		})

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
		this.vent.trigger("setStateType", 'drawing');
		this.initLayerForCollection(collection);
		collection.each(function(model) {
			self.addOne(model, collection.collectionId);
		});
		this.drawLayerForCollection(collection);
		this.vent.trigger("setStateType", 'complete');	
	},

	/**
	* Required to be implemented by descendants.
	*/
	initLayerForCollection: function(collection)
	{ 
	},

	/**
	* Required to be implemented by descendants.
	*/
    addPointToLayer: function(model, opts, collectionId) 
    {
    },

	/**
	* Required to be implemented by descendants.
	*/
	drawLayerForCollection: function(collection) 
	{
	},

    addOne: function(model, collectionId) 
    {
		var c = this.collections[collectionId];
		var params = c.params;
		var min = Number(c.minVal);
		var max = Number(c.maxVal);
		var val = model.get('val');
		
		var color;
		switch (params.colorType) {
			case COLOR_SOLID: 
				color = params.color;
				break;
			case COLOR_RANGE:
				var rainbow = new Rainbow();
				rainbow.setSpectrum(params.colorLow, params.colorHigh);		
				rainbow.setNumberRange(min, max);
				color = '#' + rainbow.colourAt(val);
				break;
		}

		this.addPointToLayer(model, {
			color: color,
			min: min,
			max: max,
			val: val,
			count: model.get('count'),
			maxcount: 10
		}, collectionId);
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
