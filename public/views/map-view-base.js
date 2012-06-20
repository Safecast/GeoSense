window.MapViewBase = Backbone.View.extend({

    initialize: function(options) {
		var self = this;
		this.collections = {};
		this.layerArray = {};
		this.vent = options.vent;
		this.layerOptions = {};
		_.bindAll(this, "setMapLocation");
		options.vent.bind("setMapLocation", this.setMapLocation);
		
		_.bindAll(this, "redrawCollection");
		options.vent.bind("redrawCollection", this.redrawCollection);  

		options.vent.bind("setViewport", function(params) {
			self.setViewport(params);  
		});
		options.vent.bind("broadcastMessageReceived", function(message) {
			var match = new String(message).match(/^@([a-zA-Z0-9_]+)( (.*))?$/);
			if (match) {
				switch (match[1]) {
					case 'setViewport':
						if (!IS_REMOTE_CONTROLLED) return;
						var obj = $.parseJSON(match[3]);
						if (obj) {
							self.vent.trigger('setViewport', obj);
						}
						return;
				}
			}
		});
	},

	setMapLocation: function(addr)
	{				
		var self = this;
		
		geocoder = new google.maps.Geocoder();
		geocoder.geocode( {'address': addr}, function (results, status)
			{
				if (status == google.maps.GeocoderStatus.OK)
				{
					results.type = 'google';
					self.setViewport(results);
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
	
	/**
	* Required to be implemented by descendants.
	*/
	setViewport: function(to) {
	},

	mapAreaChanged: function(visibleMapArea)
	{
		//this.vent.trigger("setStateType", 'loading');

		$.each(this.collections, function(collectionid, collection) { 
			collection.setVisibleMapArea(visibleMapArea);
			collection.fetch();
		});

		this.vent.trigger("updateGraphCollections", visibleMapArea);
	},

	redrawCollection: function(args)
	{
		return;
		var self = this;

		var collectionId = args.collectionId;
		var update = args.updateObject;

		for (var k in update) {
			this.collections[collectionId].options[k] = update[k];	
		}
		this.initLayerOptionsForCollection(this.collections[collectionId]);

		// TODO: This reload is NOT necessary -- SOLVE DIFFERENTLY
		$.each(this.collections, function(collectionid, collection) { 
			if(collectionid == collectionId)
				collection.fetch();
		});

	},

	addCollection: function(collection)
	{	
		console.log('addCollection '+collection.pointCollectionId);

		// TODO: deprecated
		collection.options = app.getMapLayer(collection.pointCollectionId).options;

		this.collections[collection.pointCollectionId] = collection;
		collection.bind('reset', this.reset, this);
		collection.bind('add', this.addOne, this);
		this.addCollectionToMap(collection);
		this.vent.trigger("setStateType", 'complete');
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
			self.addOne(model, collection.pointCollectionId);
		});
		this.drawLayerForCollection(collection);
		this.vent.trigger("setStateType", 'complete');	
	},

	/**
	* Required to be implemented by descendants.
	*/
	initLayerOptionsForCollection: function(collection)
	{ 
		this.layerOptions[collection.collectionId] = {
		};
		var opts = this.layerOptions[collection.collectionId];
		opts.opacity = collection.options.opacity;
		switch (collection.options.colorType) {
			case ColorType.LINEAR_GRADIENT:
				opts.colorGradient = new ColorGradient(collection.options.colors);
				break;
		}
	},

	/**
	* Required to be implemented by descendants.
	*/
	initLayerForCollection: function(collection)
	{
		this.initLayerOptionsForCollection(collection);
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
		var options = this.collections[collectionId].mapLayer.options;
		var min = this.collections[collectionId].mapLayer.pointCollection.minVal;
		var max = this.collections[collectionId].mapLayer.pointCollection.maxVal;
		var val = model.get('val').avg;
		var count = model.get('count');
		var normVal = (val - min) / (max - min);

		var color;
		switch (options.colorType) {
			case ColorType.SOLID: 
				color = options.colors[0].color;
				break;
			case ColorType.LINEAR_GRADIENT:
				color = this.layerOptions[collectionId].colorGradient
					.colorAt(normVal, COLOR_GRADIENT_STEP);
				break;
		}

		this.addPointToLayer(model, {
			collectionId: collectionId,
			color: color,
			min: min,
			max: max,
			model: model,
			data: {
				val: val,
				normVal: normVal,
				count: count,
			},
			size: count / this.collections[collectionId].maxCount
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
