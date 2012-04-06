window.MapOLView = window.MapViewBase.extend({

    tagName: 'div',
	className: 'map-view',
	
    events: {
		'click #zoomIn': 'zoomInClicked',
		'click #zoomOut': 'zoomOutClicked',
    },

    initialize: function(options) {
		MapOLView.__super__.initialize.call(this, options);
	    this.template = _.template(tpl.get('map'));
	
		_.bindAll(this, "updateMapStyle");
	 	options.vent.bind("updateMapStyle", this.updateMapStyle);
	
		this.markers = {};
		this.markerArray = [];
    },

    render: function() {
		$(this.el).html(this.template());				
        return this;
    },

	start: function() {
		var self = this;
		var mapOptions = {
			zoom: 5,
			minZoom:5,
			center: new google.maps.LatLng(38.0, -97.0),
			zoomControl: false,
			panControl: false,
			scaleControl: false,
			scaleControlOptions: { position: google.maps.ControlPosition.TOP_CENTER },
			mapTypeControl: false,
			streetViewControl: false,
			mapTypeId: google.maps.MapTypeId.ROADMAP	
		};		
	
		this.map = new google.maps.Map(this.$('#map_canvas')[0],mapOptions);
		
		//Set Listeners
		google.maps.event.addListener(this.map, 'zoom_changed', function() {
			self.setMapZoom(self.map.getZoom());
		})
		
		//Default Theme
		this.updateMapStyle(defaultMapStyle);
		
		//Default Location
		this.setMapLocation(defaultMapLocation);
		
		//Render Fusion Maps
		this.initSafecastFusionMap();
		
		this.$('#dataPoint').popover();

	},
		
	setMapZoom: function(zoom)
	{
		map_zoom = zoom;
		this.initSafecastFusionMap();
	},
	
	fitMapBounds: function(bounds) {
		this.map.fitBounds(bounds);
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
		
		if(theme != null)
		{
			var styledMapType = new google.maps.StyledMapType(style, { map: this.map, name: 'Styled Map' });
			this.map.mapTypes.set('map-style', styledMapType);
			this.map.setMapTypeId('map-style');
		}
	},
	
	zoomInClicked: function()
	{		
		map_zoom = map_zoom+1;
		this.map.setZoom(map_zoom);
	},
	
	zoomOutClicked: function()
	{
		map_zoom = map_zoom-1;
		this.map.setZoom(map_zoom);
	},
	
	initSafecastFusionMap: function()
	{
		
	},
	
	updateDataPointInfo: function(e)
	{
		
				
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
		
		if (this.markerArray.length > 0) {
			for (i in this.markerArray) {
				if(this.markerArray[i].collectionId == model.collectionId)
				{
					this.markerArray[i].setMap(null)
				}
			}
		}	
	},

	
    addOne: function(model) {
		var self = this;
		
		var collectionId = model.get('collectionid'); 
		var color = model.get('color');
		var name = model.get('name');
		
		if(color == null)
			color = '#F0F0F0'
			
		var content = "<div id='dataPoint' rel='tooltip' title='"+name+"' style='background-color:red; border-radius:10px; width:10px;height:10px;opacity:.5;" +color + ";'></div>";
	
		var marker = new RichMarker({
			map: this.map,
	 		position: new google.maps.LatLng(model.get('lat'), model.get('lon')),
			draggable: false,
			flat: true,
			anchor: RichMarkerPosition.MIDDLE,
			content: content,
			collectionId: collectionId,
		});
		
		this.markerArray.push(marker);
		this.markers[collectionId] = marker;

		google.maps.event.addListener(marker, 'mouseover', function() {	
			//console.log(model.get('location'));
		});			
		
    },
  
});