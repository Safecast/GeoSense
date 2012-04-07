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
    },

    render: function() {
		$(this.el).html(this.template());				
        return this;
    },

	start: function() {
		var self = this;
		
		var Feature = OpenLayers.Feature.Vector;
		var Geometry = OpenLayers.Geometry;
		var points = [];
		
		for (i=0;i<=50000;i++)
		{
			lat = this.getRandomInRange(180, -180, 3);
			lng = this.getRandomInRange(90, -90, 3);
			currPoint = new Geometry.Point(lat, lng);
			currPoint.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
			points.push(new Feature(currPoint));
		}
		
		console.log(points.length);
		
		var Rule = OpenLayers.Rule;
		var Filter = OpenLayers.Filter;
		
		var style = new OpenLayers.Style({
		    pointRadius: 10,
		    strokeWidth: 3,
		    strokeOpacity: 0.7,
		    strokeColor: "navy",
		    fillColor: "#ffcc66",
		    fillOpacity: 1
		}, {
		    rules: [
		        new Rule({
		            filter: new Filter.Comparison({
		                type: "==",
		                property: "cls",
		                value: "one"
		            }),
		            symbolizer: {
		                externalGraphic: "../assets/marker-blue.png"
		            }
		        }),
		        new Rule({
		            filter: new Filter.Comparison({
		                type: "==",
		                property: "cls",
		                value: "two"
		            }),
		            symbolizer: {
		                externalGraphic: "../assets/marker-green.png"
		            }
		        }),
		        new Rule({
		            elseFilter: true,
		            symbolizer: {
		                graphicName: "circle"
		            }
		        })
		    ]
		});
		
		var layer = new OpenLayers.Layer.VectorPt(null, {
			styleMap: new OpenLayers.StyleMap({
		        "default": style,
		        select: {
		            fillColor: "red",
		            pointRadius: 13,
		            strokeColor: "yellow",
		            strokeWidth: 3
		        }
		    }),
			projection: new OpenLayers.Projection("EPSG:4326"),
			sphericalMercator: true,
		    renderers: ["Canvas2"]
		});
		layer.addFeatures(points);
				
		var g = new OpenLayers.Layer.Google("Google Streets", {
			type: 'styled',
		    sphericalMercator: true,
		});
		
		var maxExtent = new OpenLayers.Bounds(-20037508, -20037508, 20037508, 20037508),
		    restrictedExtent = maxExtent.clone(),
		    maxResolution = 156543.0339;

		var map = new OpenLayers.Map({
		    div: "map_canvas",
		    projection: new OpenLayers.Projection("EPSG:900913"),
			displayProjection: new OpenLayers.Projection("EPSG:4326"),
		    numZoomLevels: 18,
		    maxResolution: maxResolution,
		    maxExtent: maxExtent,
		    restrictedExtent: restrictedExtent,
		});
		
		map.addLayers([g]);
		map.addLayers([layer]);
		
		var stylers = [ { featureType: "all", elementType: "all", stylers: [ { saturation: -100 }, { visibility: 'simplified' },{ lightness: 8 },{ gamma: 1.31 }] } ];	

		var styledMapOptions = {
			name: "Styled Map"
		};

		var styledMapType = new google.maps.StyledMapType(stylers, styledMapOptions);
		
		g.mapObject.mapTypes.set('styled', styledMapType);
		g.mapObject.setMapTypeId('styled');
		
		map.addControl(new OpenLayers.Control.MousePosition());
		
		centerPoint = new Geometry.Point(137, 36);
		centerPoint.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
		
		map.setCenter(new OpenLayers.LonLat(15458624.598242,4314309.545983),6);
		//map.setCenter(new OpenLayers.LonLat(centerPoint), 3); 
		console.log(map.getCenter());

		OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {                
		                defaultHandlerOptions: {
		                    'single': true,
		                    'double': false,
		                    'pixelTolerance': 0,
		                    'stopSingle': false,
		                    'stopDouble': false
		                },

		                initialize: function(options) {
		                    this.handlerOptions = OpenLayers.Util.extend(
		                        {}, this.defaultHandlerOptions
		                    );
		                    OpenLayers.Control.prototype.initialize.apply(
		                        this, arguments
		                    ); 
		                    this.handler = new OpenLayers.Handler.Click(
		                        this, {
		                            'click': this.trigger
		                        }, this.handlerOptions
		                    );
		                }, 

		                trigger: function(e) {
		                    var lonlat = map.getLonLatFromPixel(e.xy);
		                    console.log(lonlat.lon + " , " + lonlat.lat);
		                }

		            });

		var click = new OpenLayers.Control.Click();
		map.addControl(click);
		click.activate();

		var select = new OpenLayers.Control.SelectFeature(layer);
		map.addControl(select);
		select.activate();
		
		//Default Theme
		//this.updateMapStyle(defaultMapStyle);
		
		//Default Location
		//this.setMapLocation(defaultMapLocation);
		
		//Render Fusion Maps
		//this.initSafecastFusionMap();
		
		//this.$('#dataPoint').popover();

	},
	
	getRandomInRange: function(from, to, fixed) {
	    return (Math.random() * (to - from) + from).toFixed(fixed) * 1;
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
		
		// if (this.markerArray.length > 0) {
		// 	for (i in this.markerArray) {
		// 		if(this.markerArray[i].collectionId == model.collectionId)
		// 		{
		// 			this.markerArray[i].setMap(null)
		// 		}
		// 	}
		// }	
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
		
		//this.markerArray.push(marker);
		//this.markers[collectionId] = marker;

		google.maps.event.addListener(marker, 'mouseover', function() {	
			//console.log(model.get('location'));
		});			
		
    },
  
});