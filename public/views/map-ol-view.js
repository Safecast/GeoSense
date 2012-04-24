window.MapOLView = window.MapViewBase.extend({

    tagName: 'div',
	className: 'map-view',
	
    events: {
		"keypress #map_canvas input" : "keyDown"
    },

    initialize: function(options) {
		MapOLView.__super__.initialize.call(this, options);
	    this.template = _.template(tpl.get('map'));
	
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
		OpenLayers.ImgPath = "http://geo.media.mit.edu/assets/light/";	
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
		SE = new OpenLayers.Geometry.Point(extent.left, extent.bottom);
		SE.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
		NW = new OpenLayers.Geometry.Point(extent.right, extent.top);
		NW.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
		var bounds = [[SE.x, SE.y],[NW.x, NW.y]];
		return {
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
							self.vent.trigger('mapReady');
						});
					}
				}
            }
		});	
				
		this.map.addLayers([this.gmap]);
				
		this.addCommentLayer();
				
		this.updateMapStyle(_defaultMapStyle);
				
		this.detectMapClick();
		
		if(DEBUG) {
			this.map.addControl(new OpenLayers.Control.MousePosition());
		}

		this.setMapLocation(_defaultMapLocation);
				
		//this.map.events.register("mousemove", this.map, function (b) {
			// var a = this;
			//         var c = this.getLonLatFromPixel(b.xy),
			//             f = this.getExtent(),
			//             g = this.getCurrentSize();
			//         if (a.baseMapType == "google") {
			//             var h = new OpenLayers.Projection("EPSG:900913"),
			//                 j = new OpenLayers.Projection("EPSG:4326");
			//             c.transform(h, j);
			//             f.transform(h, j)
			//         }
			//         g = f.getWidth() / g.w;
			//         g = self.getItems(c.lon, c.lat, g * (2 + this.zoom / this.numZoomLevels * 2));
			//         f = "";
			//         f = g.length;
			//         $tooltip = $("#map-tooltip");
			//         f > 0 ? (a.curItem = a.model.items[g[0]], c = 30, f > 1 ? ($("#map-tooltip .tooltip-info").html("[ " + g.length + " more ]"), $("#map-tooltip .tooltip-info").css("display", "inline"), c = 60) : ($("#map-tooltip .tooltip-info").html(""), $("#map-tooltip .tooltip-info").css("display", "none")), f = "<span>" + a.curItem.title + "</span> ", $("#map-tooltip .tooltip-title").html(f), g = this.getSize(), f = b.xy.x, h = b.xy.y + 20, j = $tooltip.outerWidth(), f + 200 + 10 > g.w && (f -= j), h + c > g.h && (h = b.xy.y - c), $tooltip.css({
			//             left: f,
			//             top: h,
			//             display: "block"
			//         })) : ($tooltip.css({
			//             display: "none"
			//         }), a.curItem = null)
			// 
			// 		console.log(a);
	    //});
		
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
		switch(collection.params.displayType)
		{
		case 1: // Pixels
			var renderer = 'Pixels'
			break;
		case 2: // Circles
			var renderer = 'Circles'
			break
		case 3: //Rectangles
			var renderer = 'Rectangles'
			break;
		}

		switch(renderer)
		{
			case 'Pixels':
			
				var layer = new OpenLayers.Layer.VectorPt(null, {
							projection: new OpenLayers.Projection("EPSG:4326"),
							sphericalMercator: true,
				    		renderers: ["Canvas2"],
				    		wrapDateLine: true
				});

				break;
			
			case 'Circles':
			
				var Rule = OpenLayers.Rule;
				var Filter = OpenLayers.Filter;
				var maxRadius = 20;
				var context = {
	                getColor: function(feature) {
	                    console.log(feature.attributes.color);
	                    return feature.attributes.color;
	                },
	                getSize: function(feature) {
	                    return Math.min(maxRadius, 
	                    	feature.attributes.count / feature.attributes.maxcount * maxRadius);
	                }
	            };
				var style = new OpenLayers.Style({
				    pointRadius: '${getSize}',
				    strokeOpacity: 0,
				    fillColor: '${getColor}',
				    fillOpacity: .3
				}, {context: context});

				var layer = new OpenLayers.Layer.Vector(null, {
				    styleMap: new OpenLayers.StyleMap({
				        "default": style,
				    }),
				    renderers: ["Canvas"]
				});
				
				break;

			case 'Rectangles':

				//TODO: Add rectangle support
				break;

			default:
		  		//
		}

		layer.collectionId = collection.collectionId;

		this.layerArray[layer.collectionId] = layer;
			
		this.map.addLayers([this.layerArray[layer.collectionId]]);
		
	},

    addPointToLayer: function(model, opts, collectionId) 
    {
    	var loc = model.get('loc');
		var lng = loc[0];
		var lat = loc[1];

		// TODO: Crappy fix for points around the dateline -- look into layer.wrapDateLine		
		var bounds = this.getVisibleMapArea().bounds;
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
		}
		currPoint = new OpenLayers.Geometry.Point(lng, lat);
		currPoint.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
		
		// TODO: Replace VectorPt
		opts.colour = opts.color;

		var vector = new OpenLayers.Feature.Vector(currPoint, opts);
		this.layerArray[collectionId].features.push(vector);		
    },

	drawLayerForCollection: function(collection) 
	{
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
		
			currVisibility = this.layerArray[currIndex].getVisibility()
		
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
				      { gamma: 1.3 },

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
				
	  	return { x: translation.x, y: translation.y };
	},
		
	setViewport: function(result)
	{
		switch(result.type)
		{
			case 'google':

				var first = result[0],
			
			    center = this.toWebMercator(first.geometry.location),
			    viewport = first.geometry.viewport,
			    viewportSW = viewport.getSouthWest(),
			    viewportNE = viewport.getNorthEast(),
			    min = this.toWebMercator(viewportSW),
			    max = this.toWebMercator(viewportNE),
			    zoom = this.map.getZoomForExtent(new OpenLayers.Bounds(min.x, min.y, max.x, max.y));

			    console.log(center);

		    break;

		    default:
		    
		    	var center = {x: result.x, y: result.y};
		    	console.log(center);

		    	if(result.zoom) {
		    		var zoom = result.zoom;
		    	}

		    break;
		}

		if (center) {
		    this.map.setCenter(new OpenLayers.LonLat(center.x, center.y), zoom);		
		}		
	},
	
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

				now.distributeMessage('@setViewport {"x": '+lonlat.lon+', "y": '+lonlat.lat+'}');

				//Temporary!!!!
				// var commentid = 0123456;
				// 				var mapid = _mapId;
				// 				var lat = lonlat.lat;
				// 				var lon = lonlat.lon
				// 				var name = 'beef';
				// 				var text = 'burrito';
				// 				var date = new Date();
				// 
				// 				$.ajax({
				// 					type: 'POST',
				// 					url: '/api/comment/' + commentid + '/' + mapid + '/' + lat + '/' + lon + '/' + name + '/' + text + '/' + date,
				// 					success: function(data) {
				// 						console.log('stored comment');
				// 						comment = new Feature(
				// 							new Geometry.Point(lon, lat),
				// 							{cls: "one"}
				// 						);
				// 						self.commentLayer.addFeatures(comment);
				// 						
				// 					},
				// 					error: function() {
				// 						console.error('failed to store comment');
				// 					}
				// 				});
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
	
	removeCollectionFromMap: function(model) {
				
		var currCollection = model.collectionId;
		var currIndex;
								
		$.each(this.layerArray, function(index, value) { 
			if(value.collectionId == currCollection)
			{
				currIndex = index;
			}
		});
		
		if(this.layerArray[currIndex])
			this.layerArray[currIndex].destroy();
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