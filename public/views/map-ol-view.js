window.MapOLView = window.MapViewBase.extend({

    tagName: 'div',
	className: 'map-view',

	addFeatures: {
	},

    mapStyles: ['dark', 'light', 'full'],
	
    initialize: function(options) {
		MapOLView.__super__.initialize.call(this, options);
	    this.template = _.template(tpl.get('map-ol'));
	
		_.bindAll(this, "updateMapStyle");
	 	options.vent.bind("updateMapStyle", this.updateMapStyle);
	
		_.bindAll(this, "redrawMap");
	 	options.vent.bind("redrawMap", this.redrawMap);
				
		Feature = OpenLayers.Feature.Vector;
		Geometry = OpenLayers.Geometry;
		Rule = OpenLayers.Rule;
		Filter = OpenLayers.Filter;
		
		previousKey = 0;
		scope = this;
		OpenLayers.ImgPath = "/assets/openlayers-light/";	
    },

    render: function() {
		$(this.el).html(this.template());				
        this.animate();
        return this;
    },

	animate: function() {
		var self = this;
		var r = function() {
			requestAnimationFrame(r);
			TWEEN.update();
		};
		r();
	},

	getVisibleMapArea: function() {
		var map = this.map;
		var zoom = map.getZoom();
		var extent = map.getExtent();
		var center = map.getCenter();
		center.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
		var SE = new OpenLayers.Geometry.Point(extent.left, extent.bottom);
		SE.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
		var NW = new OpenLayers.Geometry.Point(extent.right, extent.top);
		NW.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
		var bounds = [[SE.x, SE.y],[NW.x, NW.y]];
		//console.log('zoom: '+zoom+', resolution '+this.selectedmap.getResolution()+' '+this.map.getUnits());
		//console.log('bounds', bounds);
		return {
			center: [center.lon, center.lat],
			zoom: zoom,
			bounds: bounds
		};
	},

	start: function(mapStyle) {
		var self = this;
					
		this.gmap = new OpenLayers.Layer.Google("Google Streets", {
			type: 'styled',
			wrapDateLine: true,
		    sphericalMercator: true,
			baselayer: true
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
		    numZoomLevels: 16,
			minZoomLevel: 3,
		    maxResolution: maxResolution,
			controls: map_controls,
			scope: this,
			eventListeners: {
               moveend: function(event) {
					self.mapAreaChanged(self.getVisibleMapArea());
				},
				addlayer: function(event) {
					if (event.layer.baselayer) {
						// We need to wait for the map to be ready so we can get its bounds.
						// Since the loadend event does not seem to be fired on the gmap layer,
						// we just register a google event on the google map object directly.
						google.maps.event.addListenerOnce(event.layer.mapObject, 'idle', function() {
							self.vent.trigger('mapViewReady');
						});
					}
				}
            }
		});	
				
		this.map.addLayers([this.gmap]);
				
		this.updateMapStyle(mapStyle || this.defaultMapStyle);
				
		var scaleLine = new OpenLayers.Control.ScaleLine();
        this.map.addControl(scaleLine);		
		
		if (DEBUG) {
			this.map.addControl(new OpenLayers.Control.MousePosition());
		}

		MapOLView.__super__.start.call(this);
		this.add30kmtemp();
	},
	
	getItems: function (a, b, c) {
		var self = this;
	    a = new Geometry.Vector2(a, b);
	    self.quadTreeRetrieve(a.x, a.y);
	    if (b == null) return [];
	    c *= c;
	    for (var d = Number.MAX_VALUE, e = [], f = 0; f < b.length; f++) {
	    	var g = b[f],
	    	h = (a.x - g.x) * (a.x - g.x) + (a.y - g.y) * (a.y - g.y);
	    	h < c && (e.push(g.id), h < d && (d = h))
 		}
		return e
	},

	/*	
	addCommentLayer: function()
	{
		var style = new OpenLayers.Style({
		    pointRadius: 15,
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
		                externalGraphic: "../assets/comment.png"
		            }
		        }),
		       
		    ]
		});
		
		var selectedStyle = new OpenLayers.Style({
		    pointRadius: 15,
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
		                externalGraphic: "../assets/comment-o.png"
		            }
		        }),
		    ]
		});
		
		this.commentLayer = new OpenLayers.Layer.Vector(null, {
		    styleMap: new OpenLayers.StyleMap({
		        "default": style,
		        select: selectedStyle
		    }),
			projection: new OpenLayers.Projection("EPSG:4326"),
			sphericalMercator: true,
		    renderers: ["Canvas"]
		});
		
		
		this.map.addLayers([this.commentLayer]);
		
		comment = new Feature(
			new Geometry.Point(319253.28496258, -1568629.5776082),
			{cls: "one"}
		);
		
		//this.commentLayer.addFeatures(comment);
		
		/*
		var select = new OpenLayers.Control.SelectFeature(this.commentLayer,
        {
            clickout: false, toggle: false,
            multiple: false, hover: false
        });

		this.commentLayer.events.on({
			"featureselected": function(e) {
				console.log('comment clicked');
			}
		});

		this.map.addControl(select);
		select.activate();
		*/
	/*},*/
	
	addKMLLayer: function(url)
	{
		kml = new OpenLayers.Layer.Vector("KML", {
			projection: new OpenLayers.Projection("EPSG:4326"),
            strategies: [new OpenLayers.Strategy.Fixed()],
			renderers: ["Canvas"],
			opacity: 0.3,
            protocol: new OpenLayers.Protocol.HTTP({
                url: url,
                format: new OpenLayers.Format.KML({
                    extractStyles: true, 
                    extractAttributes: true,
                    maxDepth: 2
                })
            })
        })
	
		this.map.addLayers([kml]);
	},

	destroyFeatureLayer: function(model) 
	{
		var pointCollectionId = model.pointCollectionId;
		this.featureLayers[pointCollectionId].destroyFeatures();
			
		// TODO: Properly destroy layer, but there is currently a bug "cannot read property style of null [layer.div]"
		/*this.map.removeLayer(this.featureLayers[pointCollectionId]);
		this.featureLayers[pointCollectionId].destroy();
		this.featureLayers[pointCollectionId] = null;*/
	},

	reset: function(collection)
	{
		var pointCollectionId = collection.pointCollectionId;
		this.featureLayers[pointCollectionId].destroyFeatures();
		MapOLView.__super__.reset.call(this, collection);
	},
	
	initFeatureLayer: function(collection)
	{ 
		MapOLView.__super__.initFeatureLayer.call(this, collection);

		var self = this;
		var minBubbleSize = 2;
		var maxBubbleSize = 60;
		var pointCollectionId = collection.pointCollectionId;

		var context = {
            getColor: function(feature) {
                return feature.attributes.color;
            },
            getDarkerColor: function(feature) {
                return feature.attributes.darkerColor;
            },
            getBubbleRadius: function(feature) {
                return minBubbleSize + feature.attributes.size * (maxBubbleSize - minBubbleSize) / 2;
            }
        };

        var layer;

        var selectStyle = {
        	fillOpacity: DEFAULT_SELECTED_FEATURE_OPACITY,
		    strokeColor: '#eee',
		    strokeOpacity: 1,
		    strokeWidth: 2
        };
        var temporaryStyle = {};

		switch (collection.mapLayer.options.featureType) {
			case FeatureType.POINTS:
			
				var style = new OpenLayers.Style({
				    fillColor: '${getColor}',
				    strokeColor: '${getDarkerColor}',
				    pointRadius: 7,
				    strokeWidth: 1,
				    fillOpacity:  this.layerOptions[pointCollectionId].opacity || DEFAULT_FEATURE_OPACITY,
				    strokeOpacity: (this.layerOptions[pointCollectionId].opacity || DEFAULT_FEATURE_OPACITY) * .8
				}, {context: context});

				layer = new OpenLayers.Layer.Vector(null, {
					projection: new OpenLayers.Projection("EPSG:4326"),
					sphericalMercator: true,
				    styleMap: new OpenLayers.StyleMap({
				        "default": style,
				        "temporary": temporaryStyle,
				        "select": selectStyle
				    }),
				    renderers: ["Canvas"],
				    wrapDateLine: true
				});

				break;

			default:
			case FeatureType.CELLS:
			
				var style = new OpenLayers.Style({
				    fillColor: '${getColor}',
				    pointRadius: 7,
				    fillOpacity: this.layerOptions[pointCollectionId].opacity || DEFAULT_FEATURE_OPACITY,
				    //strokeColor: '#333',
				    strokeOpacity: 0
				}, {context: context});

				layer = new OpenLayers.Layer.Vector(null, {
					//projection: new OpenLayers.Projection("EPSG:4326"),
					//sphericalMercator: true,
				    styleMap: new OpenLayers.StyleMap({
				        "default": style,
				        "temporary": temporaryStyle,
				        "select": selectStyle
				    }),
				    renderers: ["Canvas"],
				    wrapDateLine: true
				});

				break;
			
			case FeatureType.BUBBLES:
			
				var style = new OpenLayers.Style({
				    pointRadius: '${getBubbleRadius}',
				    strokeOpacity: 0,
				    fillColor: '${getColor}',
				    fillOpacity: this.layerOptions[pointCollectionId].opacity || DEFAULT_FEATURE_OPACITY
				}, {context: context});

				layer = new OpenLayers.Layer.Vector(null, {
				    styleMap: new OpenLayers.StyleMap({
				        "default": style,
				        "temporary": temporaryStyle,
				        "select": selectStyle
				    }),
				    renderers: ["Canvas"],
				    wrapDateLine: true
				});
				
				break;
		}

		this.featureLayers[pointCollectionId] = layer;
		this.map.addLayers([layer]);

        /*var hover = new OpenLayers.Control.SelectFeature(layer, {
            hover: true,
            highlightOnly: true,
            renderIntent: "temporary",
        });
		this.map.addControl(hover);
		hover.activate();*/

		var selectControl = new OpenLayers.Control.SelectFeature(
		  layer, {
		     clickout: true, multiple: false, hover: false, box: false,
		     onBeforeSelect: function(feature) {
		        // TODO: Since the layer is redrawn on select, selection is very slow.
		        // Workaround: Add code to add feature to highlight layer, then return false.
		         //self.featureSelected(feature);
		         //return false;
		     },
		     onSelect: function(feature) {
		        self.featureSelected(feature);
		     },
		     onUnselect: function(feature) {
		        self.featureUnselected(feature);
		        // TODO: See above
		        // add code to remove feature from highlight layer
		     },
		  }
		);
		this.map.addControl(selectControl);
		selectControl.activate();
		
	},

	add30kmtemp: function()
	{
		var style = new OpenLayers.Style({
		    strokeColor: '#ffffff',
		    pointRadius: 7,
		    fillOpacity: 0,
		    strokeOpacity: .8,
		    strokeWidth: 1
		}, {context: {}});

		layer = new OpenLayers.Layer.Vector(null, {
			projection: new OpenLayers.Projection("EPSG:4326"),
			sphericalMercator: true,
		    styleMap: new OpenLayers.StyleMap({
		        "default": style,
		    }),
		    renderers: ["Canvas"],
		    wrapDateLine: true
		});

		this.map.addLayers([layer]);


		var ctr = new OpenLayers.Geometry.Point(141.033247, 37.425252);
		ctr.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
		var geometry;

		var radius = 30000;
		var corners = [];

		var step = Math.PI / 20;
		for (var i = 0; i < Math.PI * 2; i += step) {
			var pt = new OpenLayers.Geometry.Point(ctr.x + Math.cos(i) * radius, ctr.y + Math.sin(i) * radius);
			corners.push(pt.x+' '+pt.y);
		}
		var wkt = 'POLYGON(' + corners.join(', ') + ')';
		var geometry = OpenLayers.Geometry.fromWKT(wkt);

		var feature = new OpenLayers.Feature.Vector(geometry, {});
		layer.addFeatures([feature]);
	},

	featureSelected: function(feature) {
		var model = feature.attributes.model;
		this.vent.trigger("showDetailData", feature.attributes.pointCollectionId, model);
	},

	featureUnselected: function(feature) {
		this.vent.trigger("hideDetailData", feature.attributes.pointCollectionId);
	},

    addFeatureToLayer: function(model, opts, collectionId) 
    {
    	var collection = this.collections[collectionId];

    	var loc = model.get('loc');
		var lng = loc[0];
		var lat = loc[1];

		// TODO: Crappy fix for points around the dateline -- look into layer.wrapDateLine		
		/*var bounds = this.getVisibleMapArea().bounds;
		if (bounds[0][0] < -180) {
			//console.log('dateline left ');
			if (lng > 0) {
				lng = -180 - (180 - lng);
			}
		} else if (bounds[1][0] > 180) {
			//console.log('dateline right ');
			if (lng < 0) {
				lng = 180 - (-180 - lng);
			}
		}*/
		
		var pt = new OpenLayers.Geometry.Point(lng, lat);
		var geometry;

		switch(collection.mapLayer.options.featureType)
		{
			default:
				pt.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
				geometry = pt;
				break;

			case FeatureType.CELLS:
				var gw = collection.gridSize / 2;
				var pts = [
					new OpenLayers.Geometry.Point(pt.x - gw, pt.y - gw),
					new OpenLayers.Geometry.Point(pt.x - gw, pt.y + gw),
					new OpenLayers.Geometry.Point(pt.x + gw, pt.y + gw),
					new OpenLayers.Geometry.Point(pt.x + gw, pt.y - gw)
				];
				var corners = [];
				for (var i = 0; i < pts.length; i++) {
					var pt = pts[i];
					pt.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
					corners.push(pt.x+' '+pt.y);
				}
				var wkt = 'POLYGON(' + corners.join(', ') + ')';
				var geometry = OpenLayers.Geometry.fromWKT(wkt);
				break;
		}
		
		var feature = new OpenLayers.Feature.Vector(geometry, opts);
		//console.log(geometry);
		//console.log(feature.lonlat.x);
		
		if (!this.addFeatures[collectionId]) {
			this.addFeatures[collectionId] = [];
		}
		this.addFeatures[collectionId].push(feature);
    },

	drawLayerForCollection: function(collection) 
	{
		var pointCollectionId = collection.pointCollectionId;
		if (this.addFeatures[pointCollectionId]) {
			this.featureLayers[pointCollectionId].addFeatures(
				this.addFeatures[pointCollectionId]);
			delete this.addFeatures[pointCollectionId];
		}
		this.featureLayers[pointCollectionId].redraw();
	},
	
	toggleLayerVisibility: function(pointCollectionId, state)
	{	
		this.featureLayers[pointCollectionId].setVisibility(state);
	},
	
	updateMapStyle: function(theme)
	{		
		var _visibility = "simplified"
		
		switch (theme) {
			case 'light':
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
				this.mapStyle = 'light';
				break;
			default:
				theme = 'dark'
			case 'dark':
				var style = [
				  {
				    stylers: [
					      { saturation: -100 },
					      { visibility: _visibility },
					      { lightness: 45 },
					      { invert_lightness: true },
					      { gamma: 1.1 },

						]	
				  },
				  {
				    featureType: "administrative",
				    stylers: [
				      { visibility: "off" }
				    ]
				  }
				];
				this.mapStyle = theme;
				break;
			case 'full':
				var style = [
				  {
				    stylers: []
				  }
				];	
				this.mapStyle = theme;
				break;
		}
		
		var stylers = style;	
		var styledMapOptions = {
			name: "Styled Map",			
		};
		var styledMapType = new google.maps.StyledMapType(stylers, styledMapOptions);

		this.gmap.mapObject.mapTypes.set('styled', styledMapType);
		this.gmap.mapObject.setMapTypeId('styled');
	},
	
	redrawMapLayer: function(layer)
	{
		MapOLView.__super__.redrawMapLayer.call(this, layer);
		var pointCollectionId = layer.pointCollection._id;
		this.destroyFeatureLayer(this.collections[pointCollectionId]);
		this.addCollectionToMap(this.collections[pointCollectionId]);
	},
	
	redrawMap: function()
	{
		// TODO: Not implemented
	},
	
	toWebMercator: function (googLatLng) {
		
		// Extract property names from Google response
		// It seems the API changes the response from Za/Yz/$a
		
		props = []
		for (prop in googLatLng) {
		    if (googLatLng.hasOwnProperty(prop)) {
				props.push(prop);
		    }
		}

		// Assign the property to lat/lng based on their object index
		$.each(googLatLng, function(index, val) { 
			if(index == props[0])
			{
		  		lat=val;
			} else if (index == props[1])
			{
				lng=val;
			}
		});		
		
		translation = new Geometry.Point(lng, lat);
		translation.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));	
				
	  	return [translation.x, translation.y];
	},
		
	setVisibleMapArea: function(result)
	{
		var center;
		var zoom;
		
		switch(result.type) {
			case 'google':
				var first = result[0],			
			    center = this.toWebMercator(first.geometry.location),
			    viewport = first.geometry.viewport,
			    viewportSW = viewport.getSouthWest(),
			    viewportNE = viewport.getNorthEast(),
			    min = this.toWebMercator(viewportSW),
			    max = this.toWebMercator(viewportNE),
			    zoom = this.map.getZoomForExtent(new OpenLayers.Bounds(min[0], min[1], max[0], max[1]));
			    break;

		    default:
				translation = new Geometry.Point(result.center[0], result.center[1]);
				translation.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));	
				center = [translation.x, translation.y]; 
		    	if (result.zoom != undefined) {
		    		zoom = result.zoom;
		    	}
			    break;
		}

		console.log('setVisibleMapArea', 'center:', center, 'zoom:', zoom);

		if (center) {
		    this.map.setCenter(new OpenLayers.LonLat(center[0], center[1]), zoom);		
		}		
	},

	/*	
	addOneComment: function(model) {
		var self = this;
		
		comment = new Feature(
			new Geometry.Point(model.attributes.lon, model.attributes.lat),
			{cls: "one"}
		);
		this.commentLayer.addFeatures(comment);
    },
    */
});