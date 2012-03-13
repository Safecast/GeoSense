window.MapView = Backbone.View.extend({

    tagName: 'div',
	className: 'map-view',
	
    events: {
    },

    initialize: function(options) {
	
	    this.template = _.template(tpl.get('map'));
	
		_.bindAll(this, "updateMapStyle");
		_.bindAll(this, "setMapLocation");
		_.bindAll(this, "addExternalData");
		_.bindAll(this, "drawExternalData");
		
	 	options.vent.bind("updateMapStyle", this.updateMapStyle);
	 	options.vent.bind("setMapLocation", this.setMapLocation);
		options.vent.bind("addExternalData", this.addExternalData);
		options.vent.bind("drawExternalData", this.drawExternalData);		
	
		//this.markerArray = [];
		this.collections = {};
		this.markers = [];
		
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
		this.updateMapStyle(defaultMapStyle);
		
		//Default Location
		this.setMapLocation(defaultMapLocation);
		
		//Render Fusion Maps
		this.initSafecastFusionMap();
},
	
	addCollection: function(id, collection)
	{
		this.collections[id] = collection;
		
		this.collection.bind('add',   this.addOne, this);
		this.collection.bind('reset', this.addAll, this);
		
	},
	
	setMapZoom: function(zoom)
	{
		map_zoom = zoom;
	},
	
	setMapLocation: function(addr)
	{				
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
			
			layers['squares'] = new google.maps.FusionTablesLayer({ query: {select: 'grid', from: tbl_data[18], where: ''} });
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
	
	addExternalData: function(options)
	{
		var self = this;
				
		d3.json(options.url, function(data) {
		  var overlay = new google.maps.OverlayView();
		  // Add the container when the overlay is added to the map.
		  overlay.onAdd = function() {

		    var layer = d3.select(this.getPanes().overlayLayer).append("div")
		        .attr("class", "stations");

		    // Draw each marker as a separate SVG element.
		    // We could use a single SVG, but what size would it have?
		    overlay.draw = function() {
		      var projection = this.getProjection(),
		          padding = 10;

		      var marker = layer.selectAll("svg")
		          .data(d3.entries(data))
		          .each(transform) // update existing markers
		        .enter().append("svg:svg")
		          .each(transform)
		          .attr("class", "marker");

		      // Add a circle.
		      marker.append("svg:circle")
		          .attr("r", 4.5)
		          .attr("cx", padding)
		          .attr("cy", padding);

		      // Add a label.
			
		      marker.append("svg:text")
		          .attr("x", padding + 7)
		          .attr("y", padding)
		          .attr("dy", ".31em")
		          .text(function(d) { return d.key; });
			
		      function transform(d) {

		        d = new google.maps.LatLng(d.value[1], d.value[0]);
		        d = projection.fromLatLngToDivPixel(d);
		        return d3.select(this)
		            .style("left", (d.x - padding) + "px")
		            .style("top", (d.y - padding) + "px");
		      }
		    };
		  };	

		  overlay.setMap(self.map);
		});
	},
	
	drawExternalData:function(val)
	{
		var input = val.substring(0, val.length);
		var latlngStr = input.split(",",2);
		var lat = parseFloat(latlngStr[0]);
		var lng = parseFloat(latlngStr[1]);
		latlngArray = new google.maps.LatLng(lat, lng);
		//console.log('lat: ' + lat + ' lon: ' +lng);

/*
		var marker = new google.maps.Marker({
			map: this.map,
			position: latlngArray,
			draggable: false
		})
*/		
		var marker = new RichMarker({
			map: this.map,
	 		position: new google.maps.LatLng(lat, lng),
			draggable: true,
			flat: true,
			anchor: RichMarkerPosition.MIDDLE,
			content: '<div class="data"></div>'
		});
	},

    addOne: function(data) {
		var self = this;
    },

    addAll: function() {
		var self = this;
    }
  
});