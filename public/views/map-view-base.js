window.MapViewBase = Backbone.View.extend({

    initialize: function(options) {
		var self = this;
		this.collections = {};
		this.featureLayers = {};
		this.vent = options.vent;
		this.layerOptions = {};
		_.bindAll(this, "geocodeAndSetMapLocation");
		options.vent.bind("geocodeAndSetMapLocation", this.geocodeAndSetMapLocation);
		
		_.bindAll(this, "redrawMapLayer");
		options.vent.bind("redrawMapLayer", this.redrawMapLayer);  

		if (options.visibleMapArea) {
			this.initialVisibleMapArea = options.visibleMapArea;
		}

		_.bindAll(this, "toggleLayerVisibility");
		options.vent.bind("toggleLayerVisibility", this.toggleLayerVisibility);

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
			console.log(results);
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

	start: function(viewBase, viewStyle) 
	{
		if (this.initialVisibleMapArea) {
			this.MapAreaChangedInitially = true;
			this.setVisibleMapArea(this.initialVisibleMapArea);
		}
	},

	mapAreaChanged: function(visibleMapArea)
	{
		var self = this;

		$.each(this.collections, function(key, collection) { 
			var mapLayer = app.getMapLayer(collection.pointCollectionId);
			collection.setVisibleMapArea(visibleMapArea);
			if (mapLayer.sessionOptions.visible) {
				app.fetchPointCollection(collection.pointCollectionId, collection);
			}
		});

		if (!this.MapAreaChangedInitially) {
			app.navigate(app.genMapURIForVisibleArea(visibleMapArea));
		}

		this.MapAreaChangedInitially = false;
		this.vent.trigger("updateGraphCollections", visibleMapArea);
		this.vent.trigger("mapAreaChanged", visibleMapArea);
	},

	/**
	* Required to be implemented by descendants.
	*/
	redrawMapLayer: function(layer)
	{
		this.initFeatureLayerOptions(this.collections[layer.pointCollection._id]);
	},

	addCollection: function(collection)
	{	
		console.log('addCollection '+collection.pointCollectionId);
		this.collections[collection.pointCollectionId] = collection;
		collection.bind('reset', this.reset, this);
		collection.bind('add', this.addOne, this);
		this.addCollectionToMap(collection);
	},
	
    addOne: function(model, collectionId) 
    {
		var c = this.collections[collectionId];
		var options = this.collections[collectionId].mapLayer.options;
		var min = this.collections[collectionId].mapLayer.pointCollection.minVal;
		var max = this.collections[collectionId].mapLayer.pointCollection.maxVal;
		var val = model.get('val');
		if (val.avg != null) {
			val = val.avg;
		}
		var count = model.get('count');
		var normVal = (val - min) / (max - min);

		var color;
		switch (options.colorType) {
			case ColorType.SOLID: 
				color = options.colors[0].color;
				break;
			case ColorType.LINEAR_GRADIENT:
			case ColorType.PALETTE:
				color = this.layerOptions[collectionId].colorGradient
					.colorAt(normVal, COLOR_GRADIENT_STEP);
				break;
		}

		this.addFeatureToLayer(model, {
			pointCollectionId: collectionId,
			color: color,
			darkerColor: multRGB(color, .75),
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

    addAll: function(collection) {	
		//this.addCollectionToMap(this.collection);
		var self = this;
		var pointCollectionId = collection.pointCollectionId;
		collection.each(function(model) {
			self.addOne(model, pointCollectionId);
		});
		self.drawLayerForCollection(collection);
    },

	reset: function(collection) {
		var pointCollectionId = collection.pointCollectionId;
		this.addAll(collection);
	},

	addCollectionToMap: function(collection)
	{
		var self = this;
		var pointCollectionId = collection.pointCollectionId;
		this.vent.trigger("setStateType", 'drawing', pointCollectionId);
		self.initFeatureLayerOptions(collection);
		self.initFeatureLayer(collection);
		self.addAll(collection);
	},

	/**
	* Required to be implemented by descendants.
	*/
	initFeatureLayerOptions: function(collection)
	{ 
		var pointCollectionId = collection.pointCollectionId;
		this.layerOptions[pointCollectionId] = {};
		var opts = this.layerOptions[pointCollectionId];
		opts.opacity = collection.mapLayer.options.opacity;
		switch (collection.mapLayer.options.colorType) {
			case ColorType.PALETTE:
			case ColorType.LINEAR_GRADIENT:
				opts.colorGradient = new ColorGradient(collection.mapLayer.options.colors);
				break;
		}
	},

	/**
	* Required to be implemented by descendants.
	*/
	initFeatureLayer: function(collection)
	{
	},

	/**
	* Required to be implemented by descendants.
	*/
    addFeatureToLayer: function(model, opts, collectionId) 
    {
    },

	/**
	* Required to be implemented by descendants.
	*/
	drawLayerForCollection: function(collection) 
	{
	},

	/**
	* Required to be implemented by descendants.
	*/
	toggleLayerVisibility: function(pointCollectionId, state)
	{	
	}

});
