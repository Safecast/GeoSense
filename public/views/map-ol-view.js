define([
    'jquery',
    'underscore',
    'backbone',
    'config',
    'utils',
    'text!templates/map-ol.html',
    'views/map-view-base',
    'openlayers',
    'cloudmade',
    'stamen'
], function($, _, Backbone, config, utils, templateHtml, MapViewBase, OpenLayers) {
    "use strict";

    var Geometry = OpenLayers.Geometry;
    var MapOLView = MapViewBase.extend({

        tagName: 'div',
        className: 'map-view',

        _addFeatures: {
        },
        
        initialize: function(options) 
        {
            MapOLView.__super__.initialize.call(this, options);
            this.template = _.template(templateHtml);
        
            _.bindAll(this, "updateViewStyle");
            options.vent.bind("updateViewStyle", this.updateViewStyle);

            _.bindAll(this, "updateViewBase");
            options.vent.bind("updateViewBase", this.updateViewBase);

            this.externalProjection = new OpenLayers.Projection("EPSG:4326"); // aka WGS 84
            this.internalProjection = null; // determined by baselayer -- usually EPSG:900913

            OpenLayers.ImgPath = "/assets/openlayers-light/";   
            this.featureLayers = {};
        },

        getVisibleMapArea: function() 
        {
            var map = this.map,
                zoom = map.getZoom(),
                extent = map.getExtent(),
                center = map.getCenter();

            var SW = new OpenLayers.Geometry.Point(extent.left, extent.bottom),
                NE = new OpenLayers.Geometry.Point(extent.right, extent.top);
            var radius = Math.sqrt(Math.pow((NE.x - SW.x) / 2, 2) + Math.pow((NE.y - SW.y) / 2, 2)) / 1000; // km
            SW.transform(this.internalProjection, this.externalProjection);
            NE.transform(this.internalProjection, this.externalProjection);
            var bounds = [[SW.x, SW.y],[NE.x, NE.y]];

            center.transform(this.internalProjection, this.externalProjection);
            center = [center.lon, center.lat];

            return {
                center: center,
                zoom: zoom,
                bounds: bounds,
                radius: radius
            };
        },

        render: function(viewBase, viewStyle) 
        {
            $(this.el).html(this.template());
            return this;
        },

        renderMap: function(viewBase, viewStyle)
        {                                       
            var self = this;
            this.map = new OpenLayers.Map({
                div: "map_canvas",
                displayProjection: this.externalProjection,
                //numZoomLevels: MAP_NUM_ZOOM_LEVELS,
                scope: this,
                controls: [],
                eventListeners: {
                    moveend: function(event) {
                        if (self.map.suppressMoveEnd) {
                            self.map.suppressMoveEnd = false;
                            return;
                        }
                        self.visibleAreaChanged(self.getVisibleMapArea());
                    },
                }
            }); 

            // TODO: should limit vertically, but not horizontally?
            // var extent = new OpenLayers.Bounds(-20037508, -20037508, 20037508, 20037508);
            //this.map.setOptions({restrictedExtent: extent});

            this.map.addControls([new OpenLayers.Control.PanZoomBar(),
                new OpenLayers.Control.Navigation() /*, new OpenLayers.Control.KeyboardDefaults()*/]);

            this.updateViewBase(viewBase, viewStyle);
                    
            var scaleLine = new OpenLayers.Control.ScaleLine();
            this.map.addControl(scaleLine);
            this.map.addControl(new OpenLayers.Control.Attribution());

            if (DEBUG) {
                this.map.addControl(new OpenLayers.Control.MousePosition());
            }

            this.internalProjection = this.map.baseLayer.projection;
            this.formats = {
                geoJSON: new OpenLayers.Format.GeoJSON({
                    internalProjection: this.internalProjection,
                    externalProjection: this.externalProjection,
                    ignoreExtraDims: true
                })
            };

            MapOLView.__super__.renderMap.call(this, viewBase, viewStyle);
            return this;
        },

        initSelectControl: function()
        {
            var self = this,
                layers = [];
            this.map.layers.forEach(function(layer, index) {
                if (!layer.baselayer) {
                    layers.push(layer);
                }
            });
            if (this.selectControl) {
                this.map.removeControl(this.selectControl);
            }

            // too slow because of redrawing of full layer
            /*var hover = new OpenLayers.Control.SelectFeature(layer, {
                hover: true,
                highlightOnly: true,
                renderIntent: "temporary",
            });
            this.map.addControl(hover);
            hover.activate();*/

            this.selectControl = new OpenLayers.Control.SelectFeature(layers, {
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
            });

            this.map.addControl(this.selectControl);
            this.selectControl.activate();
            // make sure the SelectControl does not disable map panning when clicked on feature
            this.selectControl.handlers.feature.stopDown = false;
        },

        attachLayer: function(model)
        {
            this.initRenderLayer(model);
            MapOLView.__super__.attachLayer.call(this, model);
        },

        getStyleMapForLayer: function(model)
        { 
            var self = this,
                layerOptions = model.getLayerOptions(),
                or = function(val1, val2) {
                    return (val1 || val1 == 0) && val1 != '' 
                        && (typeof val1 == 'string' || val1 >= 0) ? val1 : val2;
                },
                opacity = layerOptions.opacity,
                maxBubbleSize = or(layerOptions.featureSize, MAX_BUBBLE_SIZE),
                minBubbleSize = Math.min(maxBubbleSize, or(layerOptions.minFeatureSize, MIN_BUBBLE_SIZE));

            var context = {
                getColor: function(feature) {
                    return feature.attributes.color;
                },
                getDarkerColor: function(feature) {
                    return feature.attributes.darkerColor;
                },
                getBubbleRadius: function(feature) {
                    if (isNaN(feature.attributes.size)) {
                        return minBubbleSize * .5;
                    }
                    return (minBubbleSize + feature.attributes.size * 
                        (maxBubbleSize - minBubbleSize)) * .5;
                }            
            };

            var defaultStyle = {
                    pointRadius: or(layerOptions.featureSize * .5, DEFAULT_POINT_RADIUS),
                    fillColor: '${getColor}',
                    fillOpacity: opacity,
                    strokeDashstyle: layerOptions.strokeDashstyle,
                    strokeLinecap: layerOptions.strokeLinecap,
                    graphicZIndex: 0,
                    graphicName: null
                };

            switch (layerOptions.featureType) {

                case FeatureType.GRAPHIC:
                    defaultStyle = _.extend(defaultStyle, {
                        externalGraphic: layerOptions.externalGraphic,
                        graphicWidth: layerOptions.graphicWidth,
                        graphicHeight: layerOptions.graphicHeight
                    });                        

                default:
                case FeatureType.POINTS:
                    defaultStyle = _.extend(defaultStyle, {
                        strokeColor: or(layerOptions.strokeColor, '${getDarkerColor}'),
                        strokeWidth: or(layerOptions.strokeWidth, DEFAULT_FEATURE_STROKE_WIDTH),
                        strokeOpacity: or(layerOptions.strokeOpacity, opacity * .8)
                    });
                    break;

                case FeatureType.SQUARE_TILES:
                    defaultStyle = _.extend(defaultStyle, {
                        strokeColor: or(layerOptions.strokeColor, '${getDarkerColor}'),
                        strokeWidth: or(layerOptions.strokeWidth, DEFAULT_FEATURE_STROKE_WIDTH),
                        strokeOpacity: or(layerOptions.strokeOpacity, opacity * .8)
                    });
                    break;

                case FeatureType.SHAPES:
                    defaultStyle = _.extend(defaultStyle, {
                        strokeColor: or(layerOptions.strokeColor, '${getColor}'),
                        strokeWidth: or(layerOptions.strokeWidth, DEFAULT_FEATURE_STROKE_WIDTH),
                        strokeOpacity: or(layerOptions.strokeOpacity, opacity),
                    });
                    break;
                
                case FeatureType.BUBBLES:
                    defaultStyle = _.extend(defaultStyle, {
                        pointRadius: '${getBubbleRadius}',
                        strokeColor: or(layerOptions.strokeColor, '${getDarkerColor}'),
                        strokeWidth: or(layerOptions.strokeWidth, DEFAULT_FEATURE_STROKE_WIDTH),
                        strokeOpacity: or(layerOptions.strokeOpacity, opacity * .5)
                    });
                    break;
            }

            var selectStyle = {
                    fillOpacity: (defaultStyle.fillOpacity == 1 ? .8 : Math.min(1, defaultStyle.fillOpacity * 1.5)),
                    strokeOpacity: (defaultStyle.strokeOpacity == 1 ? .1 : Math.min(1, defaultStyle.strokeOpacity * 1.5)),
                    //TODO: this is not having any effect
                    graphicZIndex: 100
                };

            var styleMap = new OpenLayers.StyleMap({
                'default': new OpenLayers.Style(defaultStyle, {context: context}),
                'select': new OpenLayers.Style(selectStyle, {context: context})
            });

            return styleMap;
        },


        layerToggled: function(model)
        {
            this.featureLayers[model.id].setVisibility(model.isEnabled());
        },

        layerChanged: function(model)
        {
            var layer = this.featureLayers[model.id];
            if (model.hasChanged('layerOptions.htmlRenderer')) {
                this.destroyRenderLayer(model);
                this.initRenderLayer(model);
                this.featureReset(model.featureCollection);
                return;
            }

            layer.styleMap = this.getStyleMapForLayer(model);
            if (model.hasChangedColors()
                || model.hasChanged('layerOptions.featureType')
                || model.hasChanged('layerOptions.featureTypeFallback')
                || model.hasChanged('layerOptions.attrMap.numeric') 
                || model.hasChanged('layerOptions.attrMap.featureSize') 
                || model.hasChanged('layerOptions.attrMap.featureColor')) {
                    // console.log('* featureReset '+collection.mapLayer.id);
                    this.featureReset(model.featureCollection);
            } else {
                // console.log('* layer.redraw '+model.id);
                layer.redraw();
            }
        },

        drawLayer: function(model)
        {
            // add all buffered features at once
            if (this._addFeatures[model.id] && this._addFeatures[model.id].length) {
                this.featureLayers[model.id].addFeatures(this._addFeatures[model.id]);
                delete this._addFeatures[model.id];
            }
        },

        initRenderLayer: function(model)
        {
            var self = this,
                opts = model.getLayerOptions(),
                layer = new OpenLayers.Layer.Vector(model.id, {
                styleMap: this.getStyleMapForLayer(model),
                renderers: [(opts.htmlRenderer && opts.htmlRenderer != '' ?
                    opts.htmlRenderer : 'SVG'), 'SVG', 'VML', 'Canvas'],
                wrapDateLine: true,
                rendererOptions: { 
                    //zIndexing: true
                }, 
            });

            this.featureLayers[model.id] = layer;
            layer.setVisibility(model.isEnabled());
            this.map.addLayers([layer]);
            this.initSelectControl();
        },

        destroyRenderLayer: function(model) 
        {
            this.featureLayers[model.id].destroyFeatures();
            this.map.removeLayer(this.featureLayers[model.id]);
            delete this.featureLayers[model.id];
        },

        destroyLayer: function(model) 
        {
            this.destroyRenderLayer(model);
            MapOLView.__super__.destroyLayer.call(this, model);
            // TODO: Properly destroy layer, but there is currently a bug "cannot read property style of null [layer.div]"
            /*this.featureLayers[model.id].destroy();*/
        },

        /**
        * Map feature collection events.
        */

        featureReset: function(collection, options) 
        {
            this.featureLayers[collection.mapLayer.id].destroyFeatures();  
            MapOLView.__super__.featureReset.call(this, collection, options);
        },        

        featureAdd: function(model, collection, options)  
        {
            // TODO: For some reason, collection and options are not passed
            // to this event handler -- check Backbone docs
            var collection = model.collection;

            var attrs = model.getRenderAttributes(),
                layerOptions = collection.mapLayer.attributes.layerOptions,
                geometry;

            switch (layerOptions.featureType) {

                case FeatureType.POINTS:
                case FeatureType.BUBBLES:
                    geometry = this.formats.geoJSON.parseGeometry({
                        type: 'Point',
                        coordinates: model.getCenter()
                    });
                    break;
                case FeatureType.SQUARE_TILES:
                    if (!layerOptions.featureTypeFallback || model.attributes.geometry.type != 'Point') {
                        geometry = this.formats.geoJSON.parseGeometry({
                            type: 'Polygon',
                            coordinates: [model.getBox()]
                        });
                        break;
                    }
                case FeatureType.SHAPES:
                    geometry = this.formats.geoJSON.parseGeometry(model.attributes.geometry);
                    break;
            }

            var feature = new OpenLayers.Feature.Vector(geometry, attrs);
            
            if (!this._addFeatures[collection.mapLayer.id]) {
                this._addFeatures[collection.mapLayer.id] = [];
            }
            this._addFeatures[collection.mapLayer.id].push(feature);
        },

        featureRemove: function(model, collection, options) 
        {
        },

        featureChange: function(model, options)
        {
        },

        featureSelected: function(feature) 
        {
            this.trigger('feature:select', feature.attributes.model);
        },

        featureUnselected: function(feature) 
        {
            this.trigger('feature:unselect', feature.attributes.model);
        },

        updateViewBase: function(viewBase, viewStyle)
        {
            if (!viewBase || !this.ViewBase[viewBase]) {
                viewBase = DEFAULT_MAP_VIEW_BASE;
            }
            if (viewBase == this.viewBase) return;

            if (this.baselayer) {
                this.map.removeLayer(this.baselayer.mapLayer);
            }

            this.baselayer = new this.ViewBase[viewBase](this.map, this, viewStyle || this.viewStyle);
            this.viewBase = viewBase;
            this.viewStyles = this.baselayer.mapStyles;
            this.viewStyle = this.baselayer.mapStyle;
            this.defaultViewStyle = this.baselayer.defaultMapStyle;
            this.map.addLayer(this.baselayer.mapLayer);

            this.vent.trigger('viewOptionsChanged', this);
        },

        updateViewStyle: function(styleName)
        {       
            if (this.baselayer.setMapStyle) {
                if (this.baselayer.setMapStyle(styleName)) {
                    this.viewStyle = this.baselayer.mapStyle;
                    this.vent.trigger('viewOptionsChanged', this);
                }
            }
        },
           
        setVisibleMapArea: function(area)
        {
            var center = new OpenLayers.LonLat(area.center[0], area.center[1]);
            center.transform(this.externalProjection, this.internalProjection);    
            this.map.setCenter(center, area.zoom);      
        },

        zoomToExtent: function(bbox) 
        {
            var bounds = new OpenLayers.Bounds(bbox[0], bbox[1], bbox[2], bbox[3]);
            bounds.transform(this.externalProjection, this.internalProjection);
            this.map.zoomToExtent(bounds, !this.map.isValidZoomLevel(
                this.map.getZoomForExtent(bounds)));
        },

    });


    var Baselayer = MapOLView.prototype.Baselayer = OpenLayers.Class(
    {
        initialize: function(map, mapView, mapStyle)
        {
            this.map = map;
            this.mapView = mapView;
            this.setMapStyle(mapStyle);
            this.initMapLayer();
        },

        initMapLayer: function(change)
        {
        },

        setMapStyle: function(styleName) 
        {
            var prevMapStyle = this.mapStyle;
            if (this.mapStyles && this.mapStyles[styleName]) {
                this.mapStyle = styleName;
            } else {
                this.mapStyle = this.defaultMapStyle;
            }
            if (prevMapStyle != this.mapStyle) {
                if (this.mapLayer) {
                    this.applyMapStyle();
                }
                return true;
            }

            return false;
        },

        applyMapStyle: function() 
        {
            if (this.mapLayer) {
                this.map.removeLayer(this.mapLayer);
                // with the exception of Google Maps, the following would fire a moveend on the map
                this.map.suppressMoveEnd = true;
                this.initMapLayer(true);
                this.map.addLayer(this.mapLayer);
            }
            return true;
        },

        mapStyles: null,
        defaultMapStyle: DEFAULT_MAP_STYLE,
        mapStyle: null
    });


    var ViewBase = MapOLView.prototype.ViewBase = {};

    ViewBase.gm = OpenLayers.Class(Baselayer,
    {
        providerName: 'Google Maps',
        initMapLayer: function(change)
        {
            var self = this;
            var layer = this.mapLayer = new OpenLayers.Layer.Google("Google Maps", {
                type: 'styled',
                wrapDateLine: true,
                sphericalMercator: true,
                baselayer: true,
                numZoomLevels: MAP_NUM_ZOOM_LEVELS
            });

            if (!change) {
                this.map.events.on({
                    'addlayer': function(event) {
                        if (event.layer.baselayer) {
                            // We need to wait for the map to be ready so we can get its bounds.
                            // Since the loadend event does not seem to be fired on the gmap layer,
                            // we just register a Google event on the Google map object directly.
                            if (event.layer == layer) {
                                self.applyMapStyle();
                                google.maps.event.addListenerOnce(event.layer.mapObject, 'idle', function() {
                                    self.mapView.trigger('view:ready');
                                });
                            }
                        }
                    }
                });
            }
        },

        applyMapStyle: function()
        {
            var _visibility = "simplified"
            switch (this.mapStyle) {
                case 'dark':
                    var style = [{
                        stylers: [
                              { saturation: -100 },
                              { visibility: _visibility },
                              { lightness: 45 },
                              { invert_lightness: true },
                              { gamma: 1.1 },

                            ]   
                    },
                    {
                        elementType: "labels",
                        stylers: [
                          { visibility: "off" }
                        ]
                    }           
                    ];
                    break;
                case 'light':
                    var style = [{
                        stylers: [
                              { saturation: -100 },
                              { visibility: _visibility },
                              { lightness: 8 },
                              { gamma: 1.31 }
                            ]
                    },
                    {
                        elementType: "labels",
                        stylers: [
                          { visibility: "off" }
                        ]
                    }           
                    ];
                    break;
                case 'full':
                    var style = [{
                        stylers: []
                    }]; 
                    break;
            }
            
            var stylers = style;    
            var styledMapOptions = {
                name: "Styled Map",         
            };
            var styledMapType = new google.maps.StyledMapType(stylers, styledMapOptions);

            this.mapLayer.mapObject.mapTypes.set('styled', styledMapType);
            this.mapLayer.mapObject.setMapTypeId('styled');
        },

        mapStyles: {
            'dark': 'Dark', 
            'light':'Light', 
            'full': 'Full'
        }

    });

    ViewBase.cm = OpenLayers.Class(Baselayer,
    {
        providerName: 'CloudMade',  
        initMapLayer: function(change)
        {
            var self = this;
            this.mapLayer = this.mapLayer = new OpenLayers.Layer.CloudMade("CloudMade", {
                key: CLOUDMADE_KEY,
                styleId: this.styleIds[this.mapStyle],
                baselayer: true,
                numZoomLevels: MAP_NUM_ZOOM_LEVELS,
                eventListeners: {
                    loadend: function() {
                        if (!change) {
                            self.mapView.trigger('view:ready');
                        }
                    }
                }
            });
        },

        mapStyles: {
            'dark': 'Dark', 
            'light': 'Light', 
            'full': 'Full'
        },

        styleIds: {
            'dark': 74569,
            'light': 74513,
            'full': 998
        }

    });

    ViewBase.osm = OpenLayers.Class(Baselayer,
    {
        providerName: 'OpenStreetMap',
        initMapLayer: function(change, tileRoot)
        {
            var self = this;
            this.mapLayer = this.mapLayer = new OpenLayers.Layer.OSM(null, tileRoot, {
                baselayer: true,
                numZoomLevels: MAP_NUM_ZOOM_LEVELS,
                eventListeners: {
                    loadend: function() {
                        if (!change) {
                            self.mapView.trigger('view:ready');
                        }
                    }
                }
            });
        },

        defaultMapStyle: null

    });

    ViewBase.stm = OpenLayers.Class(Baselayer,
    {
        providerName: 'Stamen',
        initMapLayer: function(change)
        {
            var self = this;
            this.mapLayer = this.mapLayer = new OpenLayers.Layer.Stamen(this.styleIds[this.mapStyle], {
                baselayer: true,
                numZoomLevels: MAP_NUM_ZOOM_LEVELS,
                eventListeners: {
                    loadend: function() {
                        if (!change) {
                            self.mapView.trigger('view:ready');
                        }
                    }
                }
            });
        },

        mapStyles: {
            'dark': 'Toner',
            'light': 'Toner Lite',
            'watercolor': 'Watercolor'
        },

        styleIds: {
            'dark': 'toner',
            'light': 'toner-lite',
            'watercolor': 'watercolor'
        }
    });

    ViewBase.blank = OpenLayers.Class(Baselayer,
    {
        providerName: 'Blank',
        initMapLayer: function(change)
        {
            ViewBase.osm.prototype.initMapLayer.call(this, false, "/assets/blank.gif");
        },

        mapStyles: {
            'dark': 'Dark',
            'light': 'Light'
        }

    });

    return MapOLView;
});
