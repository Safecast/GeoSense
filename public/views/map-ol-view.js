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
		
		OpenLayers.ImgPath = "http://geo.media.mit.edu/assets/light/";	
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
				
		this.map.addLayers([this.gmap]);
		
		this.addCommentLayer();
				
		this.updateMapStyle(_defaultMapStyle);
		
		//this.detectMapClick();
		
		if(DEBUG)
			this.map.addControl(new OpenLayers.Control.MousePosition());
						
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
	
	createQuadTree: function () {
	    var a = {
	        x: this.bounds.getX(),
	        y: this.bounds.getY(),
	        width: this.bounds.getWidth(),
	        height: this.bounds.getHeight()
	    };
	    (new Date).getTime();
	    this.quadTree = new QuadTree(a, !0, 7, 30);
	    for (var a = this.items.length, b = 0; b < a; b++) {
	        var c = this.items[b];
	        this.quadTree.insert({
	            x: c.lng,
	            y: c.lat,
	            id: c.id
	        })
	    }(new Date).getTime()
	},
	
	insertQuadTree: function (a) {
	    for (var b = a.length, c = 0; c < b; c++) {
	        var d = a[c];
	        this.quadTree.insert({
	            x: d.lng,
	            y: d.lat,
	            id: d.id
	        })
	    }
	},
	
	quadTreeRetrieve: function (a, b) {
	    if (!this.quadTree) return null;
	    return this.quadTree.retrieve({
	        x: a,
	        y: b
	    })
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
		
		///this.commentLayer.addFeatures(comment);
		
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
	
	addCollectionAsLayer: function(collection, renderer)
	{
		var renderer = 'Canvas2'
		
		switch(renderer)
		{
			case 'Canvas2':
			
					var layer = new OpenLayers.Layer.VectorPt(null, {
								projection: new OpenLayers.Projection("EPSG:4326"),
								sphericalMercator: true,
					    		renderers: ["Canvas2"]
					});
					
					layer.collectionId = collection.collectionId;
					this.layerArray.push(layer);
					
					currLayer = this.layerArray.length;
					this.map.addLayers([this.layerArray[currLayer-1]]);
				
			break;
			
			case 'Canvas':
			
				var Rule = OpenLayers.Rule;
				var Filter = OpenLayers.Filter;
				var style = new OpenLayers.Style({
				    pointRadius: 10,
				    strokeWidth: 0,
				    strokeOpacity: 0.0,
				    strokeColor: "navy",
				    fillColor: "#ffffff",
				    fillOpacity: .2
				});

				var layerHit = new OpenLayers.Layer.Vector(null, {
				    styleMap: new OpenLayers.StyleMap({
				        "default": style,
				        select: {
				            fillColor: "red",
				            pointRadius: 13,
				            strokeColor: "yellow",
				            strokeWidth: 3
				        }
				    }),
				    renderers: ["Canvas"]
				});

				layerHit.collectionId = collection.collectionId;

				this.layerArray.push(layerHit);
				currLayer = this.layerArray.length;

				this.map.addLayers([this.layerArray[currLayer-1]]);

				var selectControl = new OpenLayers.Control.SelectFeature(
				  this.layerArray[currLayer-1], {
				     clickout: true, multiple: false, hover: false, box: false,
				     onBeforeSelect: function(feat) {
				        console.log('grr');
				        return false;
				     },
				     onUnselect: function(feat) {
				        // add code to remove feature from highlight layer
				     }
				  }
				);
					
			break;
			
			case 'WMS':
			
				this.map.addControl(selectControl);
				selectControl.activate();
				
					var longText = new Array(205).join("1234567890");
					var base = new OpenLayers.Layer.WMS( "OpenLayers WMS",
					    "http://vmap0.tiles.osgeo.org/wms/vmap0",
					    {layers: 'basic', makeTheUrlLong: longText},
					    {tileOptions: {maxGetUrlLength: 2048}, transitionEffect: 'resize'}
					);
					var overlay = new OpenLayers.Layer.WMS("Overlay",
					    "http://suite.opengeo.org/geoserver/wms",
					    {layers: "usa:states", transparent: true, makeTheUrlLong: longText},
					    {ratio: 1, singleTile: true, tileOptions: {maxGetUrlLength: 2048}, transitionEffect: 'resize'}
					);
					this.map.addLayers([overlay]);
			
				break;
			default:
		  		//
		}
		
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
		
			//Update our local data object array
			//this.dataObjectArray[currIndex].visible = type;
			//console.log(this.dataObjectArray[currIndex].visible);
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
	
	toWebMercator: function (googLatLng) {
		translation = new Geometry.Point(googLatLng.Za, googLatLng.Ya);
		translation.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));	
				
	  	return { x: translation.x, y: translation.y };
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

			//4030302.5713791
			
			//console.log(zoom);


		    this.map.setCenter(new OpenLayers.LonLat(center.x, center.y), zoom);		
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
                           'click': this.trigger
                       }, this.handlerOptions
                   );
               }, 

               trigger: function(e) {
                   var lonlat = this.map.getLonLatFromPixel(e.xy);
					console.log(lonlat.lat);
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
             }
		});
		
		var click = new OpenLayers.Control.Click();
		this.map.addControl(click);
		click.activate();
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
		var colorlow = model.get('colorlow');
		var colorhigh = model.get('colorhigh');
		
		//Set min/max values		
		var maxVal = this.collections[collectionId].maxVal;
		var minVal = this.collections[collectionId].minVal;
		//Temporary super hack
		if(maxVal - minVal > 1000)
			maxVal = 500;
			
		var rainbow = new Rainbow();
		rainbow.setSpectrum(colorlow, colorhigh);		
		rainbow.setNumberRange(Number(minVal), Number(maxVal));
		
		var hex = '#' + rainbow.colourAt(val);
		gocolor = hex;
		
		currPoint = new OpenLayers.Geometry.Point(lat, lon);
		currPoint.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
		
		var style = new OpenLayers.Style({
		    pointRadius: 10,
		    strokeWidth: 0,
		    strokeOpacity: 0.0,
		    strokeColor: "navy",
		    fillColor: "#ffffff",
		    fillOpacity: .2
		});
		
		vector = new OpenLayers.Feature.Vector(currPoint, {
	        colour: gocolor,
		});
					
		//Add point to proper layer (by found index)
		this.layerArray[index].features.push(vector);	
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