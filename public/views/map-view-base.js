window.MapViewBase = Backbone.View.extend({

	uriViewName: undefined, 

    initialize: function(options) {
		var self = this;
		this.collections = {};
		this.featureLayers = {};
		this.vent = options.vent;
		this.layerOptions = {};
		_.bindAll(this, "geocodeAndSetMapLocation");
		options.vent.bind("geocodeAndSetMapLocation", this.geocodeAndSetMapLocation);
		
		_.bindAll(this, "redrawCollection");
		options.vent.bind("redrawCollection", this.redrawCollection);  

		if (options.visibleMapArea) {
			this.initialVisibleMapArea = options.visibleMapArea;
		}

		/*
		options.vent.bind("setVisibleMapArea", function(params) {
			self.setVisibleMapArea(params);  
		});
		options.vent.bind("broadcastMessageReceived", function(message) {
			var match = new String(message).match(/^@([a-zA-Z0-9_]+)( (.*))?$/);
			if (match) {
				switch (match[1]) {
					case 'setVisibleMapArea':
						if (!IS_REMOTE_CONTROLLED) return;
						var obj = $.parseJSON(match[3]);
						if (obj) {
							self.vent.trigger('setVisibleMapArea', obj);
						}
						return;
				}
			}
		});
*/
	},

	geocodeAndSetMapLocation: function(addr)
	{				
		var self = this;
		
		geocoder = new google.maps.Geocoder();
		geocoder.geocode( {'address': addr}, function (results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				results.type = 'google';
				self.setVisibleMapArea(results);
			} else { 	
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
	setVisibleMapArea: function(to) {
	},

	start: function() 
	{
		if (this.initialVisibleMapArea) {
			this.MapAreaChangedInitially = true;
			this.setVisibleMapArea(this.initialVisibleMapArea);
		}
	},

	mapAreaChanged: function(visibleMapArea)
	{
		var self = this;

		$.each(this.collections, function(collectionid, collection) { 
			self.vent.trigger("setStateType", 'loading', collection.pointCollectionId);
			collection.setVisibleMapArea(visibleMapArea);
			collection.fetch();
		});

		if (!this.MapAreaChangedInitially) {
			var uri = app.genMapURI(this.uriViewName, {
				x: visibleMapArea.center[0],
				y: visibleMapArea.center[1],
				zoom: visibleMapArea.zoom
			});
			app.navigate(uri);
		}

		this.MapAreaChangedInitially = false;
		this.vent.trigger("updateGraphCollections", visibleMapArea);
		this.vent.trigger("mapAreaChanged", visibleMapArea);
	},

	redrawCollection: function(args)
	{
		var self = this;

		var pointCollectionId = args.pointCollectionId;
		var update = args.updateObject;

		for (var k in update) {
			this.collections[pointCollectionId].options[k] = update[k];	
		}
		this.initLayerOptionsForCollection(this.collections[pointCollectionId]);
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

	reset: function(collection) {
		var pointCollectionId = collection.pointCollectionId;
		this.removeCollectionFromMap(collection);
		if (collection.length > 0) {
			this.addCollectionToMap(this.collections[pointCollectionId]);
		}
		this.vent.trigger("setStateType", 'complete', pointCollectionId);	
	},

	resetComments: function(model) {
		//this.removeCollectionFromMap(model);
		this.addCommentToMap(model);
	},

	addCollectionToMap: function(collection)
	{
		var self = this;
		var pointCollectionId = collection.pointCollectionId;
		this.vent.trigger("setStateType", 'drawing', pointCollectionId);
		this.initLayerForCollection(collection);
		collection.each(function(model) {
			self.addOne(model, collection.pointCollectionId);
		});
		this.drawLayerForCollection(collection);
	},

	/**
	* Required to be implemented by descendants.
	*/
	initLayerOptionsForCollection: function(collection)
	{ 
		var pointCollectionId = collection.pointCollectionId;
		this.layerOptions[pointCollectionId] = {};
		var opts = this.layerOptions[pointCollectionId];
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
			pointCollectionId: collectionId,
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
