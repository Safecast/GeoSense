window.MapOLView = window.MapViewBase.extend({

    tagName: 'div',
	className: 'map-view',

	addFeatures: {
	},
	
    events: {
		"keypress #map_canvas input" : "keyDown"
    },

    initialize: function(options) {
		MapOLView.__super__.initialize.call(this, options);
	    this.template = _.template(tpl.get('map-ol'));
	
		$(document).on('keydown', this.keyDown);
	
		_.bindAll(this, "updateMapStyle");
	 	options.vent.bind("updateMapStyle", this.updateMapStyle);
	
		_.bindAll(this, "toggleLayerVisibility");
		options.vent.bind("toggleLayerVisibility", this.toggleLayerVisibility);
		
		_.bindAll(this, "redrawMap");
	 	options.vent.bind("redrawMap", this.redrawMap);
	
		_.bindAll(this, "redrawLayer");
	 	options.vent.bind("redrawLayer", this.redrawLayer);
			
		Feature = OpenLayers.Feature.Vector;
		Geometry = OpenLayers.Geometry;
		Rule = OpenLayers.Rule;
		Filter = OpenLayers.Filter;
		
		previousKey = 0;
		scope = this;
		OpenLayers.ImgPath = "/assets/openlayers-light/";	
    },

	keyDown: function(e)
	{	
		var key = e.keyCode;
		if(key == 49 && previousKey == 49)
			scope.addKMLLayer('data/coast.kml');
			
		previousKey = 49;
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

	start: function() {
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
				
		//this.addCommentLayer();
				
		this.updateMapStyle(DEFAULT_MAP_STYLE);
				
		//this.detectMapClick();

		var scaleLine = new OpenLayers.Control.ScaleLine();
        this.map.addControl(scaleLine);		
		
		if (DEBUG) {
			this.map.addControl(new OpenLayers.Control.MousePosition());
		}

		MapOLView.__super__.start.call(this);
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
	},
	
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
	
	initLayerForCollection: function(collection)
	{ 
		MapOLView.__super__.initLayerForCollection.call(this, collection);

		var self = this;
		var minBubbleSize = 2;
		var maxBubbleSize = 60;

		var context = {
            getColor: function(feature) {
                return feature.attributes.color;
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

		switch(collection.options.featureType)
		{
			case FeatureType.POINTS:
			
				var style = new OpenLayers.Style({
				    fillColor: '${getColor}',
				    strokeColor: '#333',
				    pointRadius: 7,
				    fillOpacity:  this.layerOptions[collection.collectionId].opacity || DEFAULT_FEATURE_OPACITY,
				    strokeOpacity: 0
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
				    strokeColor: '#333',
				    pointRadius: 7,
				    fillOpacity: this.layerOptions[collection.collectionId].opacity || DEFAULT_FEATURE_OPACITY,
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
				    fillOpacity: this.layerOptions[collection.collectionId].opacity || DEFAULT_FEATURE_OPACITY
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

		layer.collectionId = collection.collectionId;
		this.layerArray[layer.collectionId] = layer;
		this.map.addLayers([this.layerArray[layer.collectionId]]);

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

	featureSelected: function(feature) {
		var model = feature.attributes.model;
		this.vent.trigger("showDetailData", feature.attributes.collectionId, model);
	},

	featureUnselected: function(feature) {
		this.vent.trigger("hideDetailData", feature.attributes.collectionId);
	},

    addPointToLayer: function(model, opts, collectionId) 
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

		switch(collection.options.featureType)
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
		if (this.addFeatures[collection.collectionId]) {
			this.layerArray[collection.collectionId].addFeatures(this.addFeatures[collection.collectionId]);
			delete this.addFeatures[collection.collectionId];
		}
		this.layerArray[collection.collectionId].redraw();
	},
	
	toggleLayerVisibility: function(index, type, layer)
	{	
		if(layer == 'comments')
		{
			if(type == 0)
			{
				this.commentLayer.setVisibility(false);
			}else
			{
				this.commentLayer.setVisibility(true);
			}	
		}
		else if (layer == 'tweets')
		{
			
		} else
		{		
			var currCollection = index;
			var currIndex;
			$.each(this.layerArray, function(index, value) { 
				if(value.collectionId == currCollection)
					currIndex = index;
			});
		
			currVisibility = this.layerArray[currIndex].getVisibility();
		
			if(type == 0)
			{
				this.layerArray[currIndex].setVisibility(false);
			}else
			{
				this.layerArray[currIndex].setVisibility(true);
			}
		}
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
			name: "Styled Map",			
		};
		var styledMapType = new google.maps.StyledMapType(stylers, styledMapOptions);

		this.gmap.mapObject.mapTypes.set('styled', styledMapType);
		this.gmap.mapObject.setMapTypeId('styled');
	},
	
	redrawLayer: function(layer)
	{
		
		var currCollection = layer;
		var currIndex;
		$.each(this.layerArray, function(index, value) { 
			if(value.collectionId == currCollection)
				currIndex = index;
		});
	
		currVisibility = this.layerArray[currIndex].getVisibility()
		//Needs to be finished
		//this.layerArray[currIndex].destroy();
		//this.addCollectionAsLayer(this.collections[layer]);
		
	},
	
	redrawMap: function()
	{
		
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
		console.log('setVisibleMapArea', result);

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
	detectMapClick: function ()
	{
		var self = this;
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
                        'click': this.onClick,
                        'dblclick': this.onDblclick 
                    }, this.handlerOptions
                );
            }, 

            onClick: function(evt) {
	            var lonlat = self.map.getLonLatFromPixel(evt.xy);
		    	translation = new Geometry.Point(lonlat.x, lonlat.y);
				translation.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
            },

            onDblclick: function(evt) {  
            }   

        });

		var dblClick = new OpenLayers.Control.Click({
	        handlerOptions: {
	            "double": true
	        }
	    });
		this.map.addControl(dblClick);
		dblClick.activate();
	},
	*/
	
	removeCollectionFromMap: function(model) {

		//console.log('removeCollectionFromMap? '+model.collectionId);
		if (this.layerArray[model.collectionId]) {
			this.layerArray[model.collectionId].destroyFeatures();
			
			// TODO: Properly destroy layer, but there is currently a bug "cannot read property style of null [layer.div]"
			/*this.map.removeLayer(this.layerArray[model.collectionId]);
			this.layerArray[model.collectionId].destroy();
			this.layerArray[model.collectionId] = null;
			console.log('removeCollectionFromMap: '+model.collectionId);*/
		}
	},

	addOneComment: function(model) {
		var self = this;
		
		comment = new Feature(
			new Geometry.Point(model.attributes.lon, model.attributes.lat),
			{cls: "one"}
		);
		this.commentLayer.addFeatures(comment);
    },
});