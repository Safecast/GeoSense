window.MapOLView = window.MapViewBase.extend({

    tagName: 'div',
	className: 'map-view',
	
    events: {
    },

    initialize: function(options) {
		MapOLView.__super__.initialize.call(this, options);
	    this.template = _.template(tpl.get('map'));
	
		_.bindAll(this, "updateMapStyle");
	 	options.vent.bind("updateMapStyle", this.updateMapStyle);
	
		_.bindAll(this, "toggleLayerVisibility");
		options.vent.bind("toggleLayerVisibility", this.toggleLayerVisibility);
	
		this.layerArray = [];
		
		Feature = OpenLayers.Feature.Vector;
		Geometry = OpenLayers.Geometry;
		Rule = OpenLayers.Rule;
		Filter = OpenLayers.Filter;
		
		OpenLayers.ImgPath = "http://js.mapbox.com/theme/dark/";	
    },

    render: function() {
		$(this.el).html(this.template());				
        return this;
    },

	start: function() {
		var self = this;
					
		this.gmap = new OpenLayers.Layer.Google("Google Streets", {
			type: 'styled',
		    sphericalMercator: true,
		});
		        
		var maxExtent = new OpenLayers.Bounds(-20037508, -20037508, 20037508, 20037508),
		    restrictedExtent = maxExtent.clone(),
		    maxResolution = 156543.0339;
		
		map_controls = [ 
		new OpenLayers.Control.PanZoomBar(),
		new OpenLayers.Control.Navigation(),
		];

		this.map = new OpenLayers.Map({
		    div: "map_canvas",
		    projection: new OpenLayers.Projection("EPSG:900913"),
			displayProjection: new OpenLayers.Projection("EPSG:4326"),
		    numZoomLevels: 18,
		    maxResolution: maxResolution,
		    maxExtent: maxExtent,
		    restrictedExtent: restrictedExtent,
			controls: map_controls,
			
		});
				
		this.layer = new OpenLayers.Layer.VectorPt(null, {
			projection: new OpenLayers.Projection("EPSG:4326"),
			sphericalMercator: true,
		    renderers: ["Canvas2"]
		});
				
		this.map.addLayers([this.gmap]);
		this.map.addLayers([this.layer]);
				
		this.updateMapStyle(_defaultMapStyle);
		
		if(DEBUG)
			this.map.addControl(new OpenLayers.Control.MousePosition());
					
		centerPoint = new Geometry.Point(137, 36);
		centerPoint.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
		this.map.setCenter(new OpenLayers.LonLat(15458624.598242,4314309.545983),6);

	},
	
	addCollectionAsLayer: function(collection)
	{
		var layer = new OpenLayers.Layer.VectorPt(null, {
			projectionon: new OpenLayers.Projection("EPSG:4326"),
			sphericalMercator: true,
		    renderers: ["Canvas2"]
		});
		
		layer.collectionId = collection.collectionId;
		
		this.layerArray.push(layer);
		currLayer = this.layerArray.length;
		
		this.map.addLayers([this.layerArray[currLayer-1]]);
		
	},
	
	toggleLayerVisibility: function(index, type)
	{		
		var currCollection = index;
		var currIndex;
		$.each(this.layerArray, function(index, value) { 
			if(value.collectionId == currCollection)
				currIndex = index;
		});
		
		currVisibility = this.layerArray[currIndex].getVisibility()
		
		if(type == 0)
		{
			this.layerArray[currIndex].setVisibility(false);
		}else
		{
			this.layerArray[currIndex].setVisibility(true);
		}
		
		//Update our local data object array
		//this.dataObjectArray[currIndex].visible = type;
		//console.log(this.dataObjectArray[currIndex].visible);
	},
	
	updateMapStyle: function(theme)
	{		
		var _visibility = "simplified"
		
		if(theme == 'light')
		{
			var style = [
			  {
			    stylers: [
				      { saturation: -100 },
				      { visibility: _visibility },
				      { lightness: 8 },
				      { gamma: 1.31 }
				    ]
			  }
			];
		} else if (theme == 'dark')
		{
			var style = [
			  {
			    stylers: [
				      { saturation: -100 },
				      { visibility: _visibility },
				      { lightness: 45 },
				      { invert_lightness: true },
				      { gamma: 0.88 }
					]
			  }
			];	
		} else if (theme == 'none')
		{
			var style = [
			  {
			    stylers: []
			  }
			];	
		}
		
		var stylers = style;	
		var styledMapOptions = {
			name: "Styled Map"
		};
		var styledMapType = new google.maps.StyledMapType(stylers, styledMapOptions);

		this.gmap.mapObject.mapTypes.set('styled', styledMapType);
		this.gmap.mapObject.setMapTypeId('styled');
	},
		
	setViewPort: function(result)
	{
		var first = result[0],
		
		    center = this.toWebMercator(first.geometry.location),
		    viewport = first.geometry.viewport,
		    viewportSW = viewport.getSouthWest(),
		    viewportNE = viewport.getNorthEast(),
		    min = this.toWebMercator(viewportSW),
		    max = this.toWebMercator(viewportNE),
		    zoom = this.map.getZoomForExtent(new OpenLayers.Bounds(min.x, min.y, max.x, max.y));

		    this.map.setCenter(new OpenLayers.LonLat(center.x, center.y), zoom);		
	},
	
	toWebMercator: function (googLatLng) {
		tranlation = new Geometry.Point(googLatLng.Ya, googLatLng.Xa);
		tranlation.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));	
	  	return { x: tranlation.x, y: tranlation.y };
	},
	
	removeMarkers: function() {
	
		if (this.markerArray.length > 0) {
			for (i in this.markerArray) {				
				this.markerArray[i].setMap(null);
			}
		}
		this.markerArray = [];
		this.markers = {};
	},
	
	removeCollectionFromMap: function(model) {
				
		var currCollection = model.collectionId;
		var currIndex;
								
		$.each(this.layerArray, function(index, value) { 
			if(value.collectionId == currCollection)
			{
				currIndex = index;
				console.log(currIndex);
			}
		});
		
		if(this.layerArray[currIndex])
			this.layerArray[currIndex].destroy();
	},

    addOne: function(model, currIndex) {
		var self = this;
		
		//Prep point for layer	
		var index = currIndex;	
		var collectionId = model.get('collectionid'); 
		var name = model.get('name');
		var location = model.get('location');
		var lat = model.get('lon');
		var lon = model.get('lat');
		var val = model.get('val');
		
		var rainbow = new Rainbow();
		rainbow.setSpectrum('green', 'FFFFFF', '#ff0000');
		rainbow.setNumberRange(0, 1000);
		var hex = '#' + rainbow.colourAt(val);
		
		currPoint = new OpenLayers.Geometry.Point(lat, lon);
		currPoint.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
		
		vector = new OpenLayers.Feature.Vector(currPoint, {
	        colour: hex,
		});
				
		//Add point to proper layer (by found index)
		this.layerArray[index].features.push(vector);
    },
});