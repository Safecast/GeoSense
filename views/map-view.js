window.MapView = Backbone.View.extend({

    tagName: 'div',
	className: 'map-view',
	
    events: {
    },

    initialize: function(options) {
	
	    this.template = _.template(tpl.get('map'));
	
		_.bindAll(this, "updateMapStyle");
		_.bindAll(this, "setMapLocation");

	 	options.vent.bind("updateMapStyle", this.updateMapStyle);
	 	options.vent.bind("setMapLocation", this.setMapLocation);

		this.markers = {};
		this.markerArray = [];
	
		this.collection.bind('add',   this.addOne, this);
		this.collection.bind('reset', this.addAll, this);
		
		// Uncomment to temporarily create entries in local storage
		//this.collection.create({
		//	text: 'reading',
		//	lat:  38.0,
	    //    lon: -97.0
		//});
    },

    render: function() {
		$(this.el).html(this.template());				
        return this;
    },

	start: function() {
		var self = this;
		var mapOptions = {
			zoom: 5,
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
		this.updateMapStyle('dark');
		
		//Default Location
		this.setMapLocation('japan');
		
		//Render Fusion Maps
		this.initSafecastFusionMap();
	},
	
	setMapZoom: function(zoom)
	{
		map_zoom = zoom;
		console.log(map_zoom);
	},
	
	setMapLocation: function(addr)
	{		
		console.log('map: ' + this.map);
		
		var self = this;
		
		geocoder = new google.maps.Geocoder();
		geocoder.geocode( {'address': addr, 'region': "jp"}, function (results, status)
			{
				if (status == google.maps.GeocoderStatus.OK)
				{
					self.map.fitBounds(results[0].geometry.viewport);
				}
				else { 	
					alert ("Cannot find " + addr + "! Status: " + status);}
		});
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
	
	initSafecastFusionMap: function()
	{
		//Clear all existing layers
		for (var layer in layers)
		{
			if (layers[layer])
			{
				layers[layer].setMap(null);
				layers[layer] = null;
			}
		}
						
		// Pull zoom key from tbl_data (based on map.getZoom())
		// Zoom less than 14 use square KML blocks, 14+ use exact dots	
					
		if(map_zoom < 14)
		{	
			if (map_zoom <= 6)
			{
				zoom_key = tbl_data[8];
			}		
			else if (map_zoom <= 8)
			{
				zoom_key = tbl_data[10];
			}
			else if (map_zoom <= 10)
			{
				zoom_key = tbl_data[15];
			}
			else if (map_zoom == 9)
			{
				zoom_key = tbl_data[10];
			}
			else if (map_zoom <= 15)
			{
				zoom_key = tbl_data[18];
			}
			else if (map_zoom > 15)
			{
				zoom_key = tbl_data[7];
			}
			
			layers['squares'] = new google.maps.FusionTablesLayer({ query: {select: 'grid', from: zoom_key, where: ''} });
			layers['squares'].setOptions({ suppressInfoWindows : true});
			listeners['squares'] = google.maps.event.addListener(layers['squares'], 'click', function(e) {app.updateDataPointInfo(e)});
			if(mobileVisible)
				layers['squares'].setMap(this.map)
				
		} else
		{
			layers['dots'] = new google.maps.FusionTablesLayer({ query: {select: 'lat_lon', from: zoom_key, where: ''}});
			layers['dots'].setOptions({ suppressInfoWindows : true, markerOptions:{enabled:false}});
			listeners['dots'] = google.maps.event.addListener(layers['dots'], 'click', function(e) {app.updateDataPointInfo(e)});
			if(mobileVisible)
				layers['dots'].setMap(this.map);	
		}			
	},

    addOne: function(reading) {
		var self = this;
				
		var markerObj = {};
		markerObj.lat = reading.get('lat');
		markerObj.lon = reading.get('lon');
		markerObj.text = reading.get('text');
			
		var marker = new google.maps.Marker({
			map: this.map,
			position: new google.maps.LatLng(38, -97),
			draggable: false
		});	
    },

    addAll: function() {
      var self = this;
		this.collection.each(function(reading){ 
		self.addOne(reading);
	 	});
    }
  
});