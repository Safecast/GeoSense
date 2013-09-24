define([
    'jquery',
    'underscore',
    'backbone',
    'views/header-view',
    'views/setup-view',
    'views/map-ol-view',
    'views/help-panel-view',
    'views/layers-panel-view',
    'views/data-detail-view',
    'views/map-info-view',
    'views/baselayer-editor-view',
    'views/map-layer-editor-view',
    'views/map-layer-view',
    'views/data-library-panel-view',
    'views/data-import-view',
    'views/modal-view',
    'views/share-view',
    'views/graphs-panel-view',
    'views/graphs/timeline-scatter-plot-view',
    'views/graphs/histogram-view',
    'models/map',
    'models/map_layer',
    'text!templates/help/about.html'
], function($, _, Backbone, HeaderView, 
    SetupView, MapOLView, HelpPanelView, LayersPanelView, DataDetailView,
    MapInfoView, BaselayerEditorView, MapLayerEditorView,
    MapLayerView, DataLibraryPanelView, DataImportView,
    ModalView, ShareView, GraphsPanelView, TimelineScatterPlotView, HistogramView,
    Map, MapLayer,
    aboutHtml) {
        "use strict";
        var MapRouter = Backbone.Router.extend({

            // custom routing happens in initialize()
            routes: {},

            defaultRoutes: {
                "admin/:slug": "mapAdminRoute",
                "admin/:slug/:view": "mapAdminRoute",
                "admin/:slug/:view/:pos": "mapAdminRoute",

                ":slug": "mapRoute",
                ":slug/:view": "mapRoute",
                ":slug/:view/:pos": "mapRoute",
            },

            byHostRoutes: {
                "admin": "mapAdminRouteByHost",
                "admin/:view": "mapAdminRouteByHost",
                "admin/:view/:pos": "mapAdminRouteByHost",

                "": "mapRouteByHost",
                ":view": "mapRouteByHost",
                ":view/:pos": "mapRouteByHost",
            },

            currentUser: function()
            {
                return window.USER;
            },

            getRoutes: function() 
            {
                var r;
                if (window.MAP_SLUG) {
                    console.log('route by custom host');
                    r = this.byHostRoutes;
                } else {
                    console.log('route by slug');
                    r = this.defaultRoutes;
                }
                var routes = [];
                for (var k in r) {
                    routes.unshift([
                        k,
                        r[k]
                    ]);
                }
                return routes;
            },

            setUIReady: function()
            {
                // remove site loading indicator
                $('#center-spinner').hide('fast', function() {
                    $(this).remove();
                });
            },

            initialize: function() 
            {
                var self = this;
                _.each(this.getRoutes(), function(route) {
                    self.route.apply(self, route);
                });

                this.map = null;
                this.isRendered = false;
                this.mapLayerSubViewsAttached = false;
                this.mapLayerEditorViews = {};
                this.graphsPanelViews = {};

                this.vent = _.extend({}, Backbone.Events);
                this.adminRoute = false;
                this.routingByHost = false;

                this.listenTo(this.vent, 'viewOptionsChanged', this.viewOptionsChanged);

                this.sessionOptions = {};

                this.isEmbedded = window != window.top;
            }, 

            mapRoute: function(slug, viewName, pos)
            {
                var mapViewName,
                    viewBase,
                    viewStyle,
                    center, 
                    zoom, x, y;

                if (viewName) {
                    this.setupRoute = viewName == 'setup';
                    if (!this.setupRoute) {
                        var split = viewName.split(':');
                        mapViewName = split.shift();
                        if (split.length > 1) {
                            viewBase = split.shift();
                        }
                        if (split.length) {
                            viewStyle = split.shift();
                        }
                    } else {
                        $('#app').empty();
                    }
                }

                if (pos != undefined) {
                    var split = pos.split(',');
                    if (split.length == 3) {
                        zoom = split.pop();
                    }
                    if (split.length == 2) {
                        x = parseFloat(split.shift());
                        y = parseFloat(split.shift());
                        if (!isNaN(x) && !isNaN(y)) {
                            center = [x, y];
                        }
                    }
                }

                if (!this.mapView) {
                    // Initialize map view
                    console.log('slug:', slug, 'mapViewName:', mapViewName, 'viewBase:', viewBase, 'viewStyle:', viewStyle, 'center:', center, 'zoom:', zoom);
                    if (!this.map) {
                        if (window.MAP) {
                            console.log('Using global MAP object');
                            this.map = new Map(window.MAP);
                        } else {
                            this.map = new Map({slug: slug});
                            this.loadAndInitMap(slug, mapViewName, center, zoom, viewBase, viewStyle);
                            return;
                        }
                    }
                    this.initMap(mapViewName, center, zoom, viewBase, viewStyle);
                } else {
                    // Navigate to area in map view (ensures back button functionality)
                    var visibleMapArea = this.getDefaultVisibleMapArea();
                    if (center) {
                        visibleMapArea.center = center;
                    }
                    if (zoom) {
                        visibleMapArea.zoom = zoom;
                    }
                    console.log('set to ', visibleMapArea);
                    this.mapView.setVisibleMapArea(visibleMapArea);
                    this.mapView.visibleAreaChanged(this.mapView.getVisibleMapArea());
                }
            },

            mapAdminRoute: function(slug, viewName, pos)
            {
                this.adminRoute = true;
                this.mapRoute(slug, viewName, pos);
            },

            mapRouteByHost: function(viewName, pos) 
            {
                this.routingByHost = true;
                return this.mapRoute(window.MAP_SLUG, viewName, pos);
            },

            mapAdminRouteByHost: function(viewName, pos) 
            {
                this.routingByHost = true;
                return this.mapAdminRoute(window.MAP_SLUG, viewName, pos);
            },

            genMapViewParam: function(mapViewName)
            {
                if (!mapViewName || mapViewName == 'map') {
                    var addBase = this.mapView.viewBase && this.mapView.viewBase != DEFAULT_MAP_VIEW_BASE;
                    var addStyle = addBase || (this.mapView.viewStyle && this.mapView.viewStyle != this.mapView.defaultViewStyle);
                    mapViewName = this.mapViewName
                        + (addStyle || addBase ? ':' : '')
                        + (addBase ? this.mapView.viewBase + ':' : '')
                        + (addStyle ? (this.mapView.viewStyle ? this.mapView.viewStyle : 'default') : '');
                }
                return mapViewName;
            },

            getCurrentViewOptions: function() {
                var opts = $.extend(this.sessionOptions.viewOptions, {
                    viewName: this.mapViewName,
                    viewBase: this.mapView.viewBase,
                    viewStyle: this.mapView.viewStyle
                });
                return opts;
            },

            genMapURI: function(mapViewName, opts, admin)
            {
                var admin = (admin || admin == undefined) && this.adminRoute;
                mapViewName = this.genMapViewParam(mapViewName);

                return genMapURI(this.map.attributes, mapViewName, opts, admin, this.routingByHost ? false : 'slug');
            },

            genPublicURL: function(forVisibleMapArea)
            {
                return genMapURL(this.map.attributes, (forVisibleMapArea ? this.getURIOptsForVisibleMapArea() : false), false);
            },

            getURIOptsForVisibleMapArea: function(visibleMapArea)
            {
                if (!visibleMapArea) {
                    var visibleMapArea = this.mapView.getVisibleMapArea();
                }
                var opts = {
                    x: visibleMapArea.center[0],
                    y: visibleMapArea.center[1],
                    zoom: visibleMapArea.zoom,
                    mapViewName: this.genMapViewParam('map')
                };
                var defaults = {
                    x: (this.map.attributes.initialArea.center.length ? this.map.attributes.initialArea.center[0] : 0),
                    y: (this.map.attributes.initialArea.center.length ? this.map.attributes.initialArea.center[1] : 0),
                    zoom: (this.map.attributes.initialArea.zoom != undefined ? this.map.attributes.initialArea.zoom : 0)
                };
                if (defaults.x != opts.x || defaults.y != opts.y || defaults.zoom != opts.zoom) {
                    return opts;
                }
                return {
                    mapViewName: opts.mapViewName
                };
            },

            genMapURIForVisibleArea: function(visibleMapArea)
            {
                return app.genMapURI(null, this.getURIOptsForVisibleMapArea(visibleMapArea));
            },

            genAdminURL: function()
            {
                return genMapURL(this.map.attributes, false, true);

            },

            loadAndInitMap: function(slug, mapViewName, center, zoom, viewBase, viewStyle)
            {
                var self = this;
                this.map.fetch({
                    success: function(model, response, options) {
                        console.log('initMapInfo');
                        console.log(self.map.attributes);
                        self.initMap();
                    },
                    error: function(model, xhr, options) {
                        console.error('failed to load map', slug);
                    }
                });
            },

            initMap: function(mapViewName, center, zoom, viewBase, viewStyle) 
            {
                var self = this;
                this.mapLayersById = {};
                _.each(this.map.attributes.layers, function(layerAttributes) {
                    self.initMapLayer(self.map.newLayerInstance(layerAttributes));
                });
                var opts = self.map.attributes.viewOptions || {};
                self.setViewOptions(opts);
                var or = function(a, b) { return a && a != '' ? a : b };
                self.initMapView(or(mapViewName, opts.viewName), 
                    center, zoom, 
                    or(viewBase, opts.viewBase), or(viewStyle, opts.viewStyle));
            },

            initMapView: function(mapViewName, center, zoom, viewBase, viewStyle) 
            {
                var self = this;

                if (!self.isRendered) {
                    self.render(mapViewName);
                }

                this.mapViewName = mapViewName;
                    
                if (this.mapView) {
                    this.mapView.remove();
                    this.mapView = null;
                }

                switch (this.mapViewName) {
                    default:
                    case 'map':
                        var viewClass = MapOLView;
                        this.mapViewName = 'map';
                        break;
                    case 'globe':
                        var viewClass = MapGLView;
                        break;
                }       
                $('.map-view-toggle').each(function() {
                    $(this).toggleClass('active', $(this).hasClass(self.mapViewName));
                });

                var visibleMapArea = this.getDefaultVisibleMapArea();
                if (center) {
                    visibleMapArea.center = center;
                }
                if (zoom) {
                    visibleMapArea.zoom = zoom;
                }

                this.layersPanelView = new LayersPanelView({vent: this.vent}).render();
                this.baselayerEditorView = new BaselayerEditorView({model: this.map}).render();

                this.mapView = new viewClass({
                    vent: self.vent,
                    visibleMapArea: visibleMapArea
                });

                this.listenTo(this.mapView, 'visibleAreaChanged', this.visibleMapAreaChanged);
                this.listenTo(this.mapView, 'feature:select', this.featureSelect);
                this.listenTo(this.mapView, 'feature:unselect', this.featureUnselect);
                this.listenTo(this.mapView, 'view:ready', this.mapViewReady);

                var mapEl = this.mapView.render().el;
                this.$mainEl.append(mapEl);
                this.mapView.renderMap(viewBase, viewStyle);

                //this.viewOptionsChanged(this.mapView);

                var snap = $('<div class="snap top" /><div class="snap right" />');
                this.$mainEl.append(snap);

                if (this.isMapAdmin()) {
                    this.helpPanelView  = new HelpPanelView().render();
                    if (!this.map.attributes.layers.length && this.isMapAdmin()) {
                        this.attachPanelView(this.helpPanelView).hide().show('fast');
                    }
                }
            },

            mapViewReady: function() 
            {
                var self = this;
                // give map a moment to load tiles
                setTimeout(function() {
                    console.log('mapViewReady: attaching sub views for all layers');
                    self.setUIReady();
                    // wait for map to be ready before we add sub views for layers
                    // because the map baselayer determines projection, etc.
                    self.attachMapLayerSubViews();
                    self.fetchMapFeatures();
                }, 200);
            },

            getMapLayer: function(layerId)
            {
                return this.mapLayersById[layerId];
            },

            initMapLayer: function(model, animate)
            {
                var self = this;

                this.mapLayersById[model.id] = model;
                // do not fetch features yet if we are waiting for mapViewReady
                if (this.mapLayerSubViewsAttached) {
                    this.attachSubViewsForMapLayer(model, animate);
                    this.fetchMapFeatures();
                }

                this.listenTo(model, 'toggle:enabled', function() {
                    self.fetchMapFeatures();                
                    // wait for animations to complete before fetching
                    /*if (model.isEnabled()) {
                        setTimeout(function() {
                            self.fetchMapFeatures();                
                        }, 300);
                    }*/
                });

                this.listenTo(model, 'showMapLayerEditor', function() {
                    this.showMapLayerEditor(model);
                });
                this.listenTo(model, 'showMapLayerGraphs', function() {
                    this.showMapLayerGraphs(model);
                });

                this.listenTo(model, 'destroy', function() {
                    self.stopListening(model);
                });

                if (model.getDataStatus() != DataStatus.COMPLETE) {
                    this.pollForMapLayerStatus(model, INITIAL_POLL_INTERVAL);
                }

                return model;
            },

            pollForMapLayerStatus: function(model, interval)
            {
                var self = this;
                // set up timeout that calls this method again
                if (interval) {
                    setTimeout(function() {
                        self.pollForMapLayerStatus(model);
                    }, interval);
                    return;
                }
                model.once('sync', function() {
                    if (model.canDisplayValues()) {
                        // if now complete, fetch features
                        self.fetchMapFeatures();
                    }
                    if (model.getDataStatus() == DataStatus.COMPLETE) return;
                    // otherwise, retry in a bit
                    self.pollForMapLayerStatus(model, POLL_INTERVAL);
                });
                // excplitly accept incomplete layers
                model.fetch({data: {incomplete: true}});
            },

            attachSubViewsForMapLayer: function(model, animate)
            {
                if (!this.layersPanelView.isAttached) {
                    this.attachPanelView(this.layersPanelView).hide().show();
                }
                console.log('attachSubViewsForMapLayer', model.id, model.getDisplay('title'), model);
                var mapLayerView = new MapLayerView({model: model, vent: this.vent}).render();
                this.layersPanelView.appendSubView(mapLayerView);
                if (animate) {
                    mapLayerView.hide().show('fast');
                }
                this.mapView.attachLayer(model);
                if (model.limitFeatures()) {
                    model.featureCollection.setVisibleMapArea(this.mapView.getVisibleMapArea());
                }

                if (model.isTimeBased() || model.histogram) {
                    var graphsPanelView = new GraphsPanelView(
                        {model: model, collection: model.featureCollection}).render();
                    if (model.isTimeBased) {
                        graphsPanelView.addGraphView('timeline', 
                            new TimelineScatterPlotView(
                                {model: model, collection: model.featureCollection}).render(), 
                            __('Timeline'));
                    }
                    if (model.histogram) {
                        graphsPanelView.addGraphView('histogram', 
                            new HistogramView(
                                {model: model, collection: model.histogram}).render(), 
                            __('Histogram'));
                    }
                    this.graphsPanelViews[model.id] = graphsPanelView;
                } else {
                    mapLayerView.disableGraphs();
                }
            },

            attachMapLayerSubViews: function()
            {
                var self = this;
                if (!self.mapLayerSubViewsAttached) {
                    self.mapLayerSubViewsAttached = true;
                    _.each(self.mapLayersById, function(mapLayer) {
                        self.attachSubViewsForMapLayer(mapLayer);
                    });
                    this.layersPanelView.show('fast');
                }
            },

            visibleMapAreaChanged: function()
            {
                var area = this.mapView.getVisibleMapArea();
                _.each(this.mapLayersById, function(mapLayer) {
                    if (mapLayer.limitFeatures()) {
                        // this will result in featureCollection.isCurrent() returning false
                        mapLayer.featureCollection.setVisibleMapArea(area);
                    }
                });
                this.fetchMapFeatures();
            },

            fetchMapFeatures: function()
            {
                _.each(this.mapLayersById, function(mapLayer) {
                    // only fetch features for enabled and non-current layers
                    if (mapLayer.isEnabled() && mapLayer.canDisplayValues()
                        && mapLayer.featureCollection.canFetch()
                        && !mapLayer.featureCollection.isCurrent()) {
                            console.log('Fetching features for', mapLayer.id, mapLayer.getDisplay('title'));
                            mapLayer.featureCollection.fetch();
                    }
                });
            },

            getDefaultVisibleMapArea: function()
            {
                var visibleMapArea = DEFAULT_MAP_AREA;
                if (this.map.attributes.initialArea && 
                    this.map.attributes.initialArea.center.length) {
                        visibleMapArea.center = this.map.attributes.initialArea.center;
                }
                if (this.map.attributes.initialArea.zoom != undefined) {
                    visibleMapArea.zoom = this.map.attributes.initialArea.zoom;
                }
                return visibleMapArea;
            },


            viewOptionsChanged: function(view)
            {
                var self = this;
                if (view == this.mapView) {
                    self.setViewOptions();

                    $("#app").removeClass(function(index, css) {
                        return (css.match(/\bmap-style-\S+/g) || []).join(' ');
                    });

                    var viewStyles = {},
                        viewStyle = this.mapView.viewStyle || 'default';
                    if (this.mapView.viewStyles) {
                        viewStyles = this.mapView.viewStyles;
                    } else {
                        viewStyles = {'default': 'Default'};
                    };
                    
                    $('#app').addClass('map-style-'+viewStyle);

                    var li = [];
                    $.each(viewStyles, function(styleName, title) {
                        var s = styleName;
                        li.push('<li class="view-style' + (s == viewStyle ? ' active' : '') + '">'
                            + '<a href="#' + s + '">' 
                            + title
                            + '</a></li>');
                    });
                    $('#viewStyle .dropdown-menu .view-style').remove();
                    $('#viewStyle .dropdown-menu').prepend(li.join(''));
                    $('#viewStyleCurrent').text(viewStyles[viewStyle]);
                    $('#viewStyle').show();

                        //$('#viewStyle').hide();

                    if (this.mapView.viewBase) {
                        var li = [];
                        for (var key in this.mapView.ViewBase) {
                            var cls = this.mapView.ViewBase[key].prototype;
                            li.push('<li class="view-base' + (key == self.mapView.viewBase ? ' active' : '') + '">'
                                + '<a href="#' + key + '">' 
                                + '<span class="view-base-thumb"' + (key != 'blank' ? ' style="background: url(' 
                                + window.BASE_URL + '/assets/baselayer-thumbs/' + key + '.png)"' : '') + '></span>'
                                + '<span class="view-base-caption">' + cls.providerName + '</span>'
                                + '</a></li>');
                        }
                        $('#viewBase .dropdown-menu .view-base').remove();
                        $('#viewBase .dropdown-menu').prepend(li.join(''));
                        $('#viewBaseCurrent').text(this.mapView.ViewBase[this.mapView.viewBase].prototype.providerName);
                        $('#viewBaselayer').show();
                    } else {
                        $('#viewBaselayer').hide();
                    }   

                    this.baselayerEditorView.$('.form-group.opacity').toggle(this.mapView.viewBase != 'blank');
                }
            },

            setViewStyle: function(viewStyle, navigate)
            {
                this.vent.trigger('updateViewStyle', viewStyle);
                if (navigate || navigate == undefined) {
                    app.navigate(app.genMapURIForVisibleArea(), {trigger: false});
                }
                this.setViewOptions();
            },

            setViewBase: function(viewBase, navigate)
            {
                this.vent.trigger('updateViewBase', viewBase);
                if (navigate || navigate == undefined) {
                    app.navigate(app.genMapURIForVisibleArea(), {trigger: false});
                }
                this.setViewOptions();
            },

            setViewOptions: function(opts) 
            {
                if (opts) {
                    this.sessionOptions.viewOptions = $.extend(this.sessionOptions.viewOptions, opts);
                } else {
                    opts = this.sessionOptions.viewOptions;
                }
                if (this.mapView) {
                    this.mapView.updateViewOptions(opts);
                }
            },

            showMapInfo: function() 
            {
                this.mapInfoView = new MapInfoView({model: this.map}).render();
                this.mapInfoView.show();
            },

            toggleDataLibrary: function() 
            {
                var self = this;
                if (!this.dataLibraryView) {
                    this.dataLibraryView = new DataLibraryPanelView().render();
                }
                if (!this.dataLibraryView.isVisible()) {
                    this.attachPanelView(this.dataLibraryView);
                    this.dataLibraryView.show('fast');
                } else {
                    this.dataLibraryView.close('fast');
                }
            },

            showShareLink: function()
            {
                var shareView = new ShareView().render();
                shareView.show();
            },

            showAbout: function() 
            {
                var modalView = new ModalView().render();
                modalView.setTitle('About GeoSense');
                modalView.setBody(aboutHtml);
                modalView.show();
            },

            showSetupView: function() 
            {
                this.setupView.show();  
            },
            
            isMapAdmin: function()
            {
                return this.adminRoute && this.map.attributes.admin; 
            },

            adjustViewport: function()
            {
                this.$mainEl.css('top', $('header').outerHeight() + 'px');
            },

            render: function() 
            {
                console.log('main render');
                var self = this;

                window.document.title = this.map.get('title') + ' – GeoSense';

                if (this.isEmbedded) {
                    $('body').addClass('embed');    
                }

                this.headerView = new HeaderView({vent: this.vent, model: this.map});
                $('#app').append(this.headerView.render().el);

                this.$mainEl = $('<div id="main-viewport"></div>');
                this.mainEl = this.$mainEl[0];
                $('#app').append(this.mainEl);

                $(window).on('resize', function() {
                    self.adjustViewport();
                });
                // wait for "next tick" to adjust viewport since toolbars might be wrapping
                setTimeout(function() {
                    self.adjustViewport();
                }, 0);

                // TODO: Detect embed 
                if (window.location.href.indexOf('4D4R0IjQJYzGP0m') != -1) {
                    $('body').addClass("embed");
                }
                
                if (this.isMapAdmin()) {
                    this.setupView = new SetupView({model: this.map}).render();
                    if (this.setupRoute) {
                        this.showSetupView();
                    }
                }
                
                self.isRendered = true;
            },

            getURLParameter:function(name) 
            {
                return decodeURI(
                    (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
                );
            },

            toggleDataImport: function() 
            {
                if (!this.dataImportView) {
                    this.dataImportView = new DataImportView({vent: this.vent}).render();
                }
                this.dataImportView.show();
            },

            featureSelect: function(model, mapFeature)    
            {
                var self = this;
                if (!SHOW_DETAIL_DATA_ON_MAP) {
                    if (!this.dataDetailView) {
                        this.dataDetailView = new DataDetailView().render();
                    }
                    if (!this.dataDetailView.isAttached) {
                        this.attachPanelView(this.dataDetailView);
                        this.dataDetailView.snapToView(this.layersPanelView, 'left', true)
                            .hide().show('fast');
                    }
                    this.dataDetailView.setPanelState(true);
                    this.dataDetailView.setModel(model);
                    this.dataDetailView.show();
                } else {
                    var dataDetailView = new DataDetailView();
                    dataDetailView.render();
                    dataDetailView.setModel(model);
                    dataDetailView.on('panel:close', function() {
                        self.mapView.destroyPopupForFeature(mapFeature);
                    });
                    var el = dataDetailView.el;
                    this.mapView.setPopupForFeature(mapFeature, el);
                }
            },

            featureUnselect: function(model, mapFeature)
            {
                if (this.dataDetailView) {
                    this.dataDetailView.hide();
                }
                this.mapView.destroyPopupForFeature(mapFeature);
            },

            showBaselayerEditor: function() 
            {
                this.attachPanelView(this.baselayerEditorView)
                    .snapToView(this.layersPanelView, 'left', true)
                    .hide()
                    .show('fast');
            },

            showMapLayerGraphs: function(model)
            {
                var self = this,
                    layerId = model.id;
                _.each(this.graphsPanelViews, function(view, id) {
                    if (layerId == id) {
                        if (!view.isAttached) {
                            self.attachPanelView(view).hide();
                        }
                        view.show('fast');
                    } else {
                        setTimeout(function() {
                            view.hide('fast');
                        }, 250);
                        
                    }
                });
            },

            showMapLayerEditor: function(model)
            {
                var layerId = model.id;
                var self = this;
                if (!this.mapLayerEditorViews[layerId]) {
                    this.mapLayerEditorViews[layerId] = new MapLayerEditorView({
                        vent: this.vent,
                        model: this.getMapLayer(layerId)
                    }).render();
                }

                for (var k in this.mapLayerEditorViews) {
                    if (layerId != this.mapLayerEditorViews[k].model.get('_id')) {
                        this.mapLayerEditorViews[k].detach();
                    } else {
                        if (!this.mapLayerEditorViews[k].isVisible()) {
                            this.mapLayerEditorViews[k].hide();
                            this.attachPanelView(this.mapLayerEditorViews[k]);
                            this.mapLayerEditorViews[k].snapToView(this.layersPanelView, 'left', true)
                                .show('fast');
                        } else {
                            this.mapLayerEditorViews[k].close('fast');
                        }
                    }
                }
            },

            attachPanelView: function(panelView)
            {
                panelView.attachTo(this.mainEl);
                return panelView;
            },

            saveNewMapLayer: function(featureCollectionId)
            {   
                var self = this;
                var layer = this.map.newLayerInstance({
                    featureCollection: {
                        _id: featureCollectionId
                    }
                });
                console.log('saving new map layer', layer);
                // success will before before attributes are set, hence wait for sync:
                layer.once('sync', function() { 
                    self.initMapLayer(layer, true);
                });
                layer.save({}, {
                    success: function(model, response, options) {
                        console.log('new map layer saved', model);
                        self.layersPanelView.show('fast');
                    },
                    error: function(model, xhr, options) {
                        console.error('failed to save new map layer');
                    }
                }); 
            },

            geocode: function(address, callback)
            {               
                // TODO move to app
                var self = this;
                
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode({'address': address}, callback);
            },

            zoomToAddress: function(address)
            {
                var self = this;
                this.geocode(address, function(results, status) {
                    if (status != google.maps.GeocoderStatus.OK) {
                        alert("Unable to find address: " + address);
                        return;
                    }
                    var viewport = results[0].geometry.viewport,
                        sw = viewport.getSouthWest(),
                        ne = viewport.getNorthEast();
                    self.mapView.zoomToExtent([sw.lng(), sw.lat(), ne.lng(), ne.lat()]);
                    $('.search-query').blur();
                });
            }

        });

        var initialize = function() {
            window.app = new MapRouter();
            if (!Backbone.history.start({
                pushState: true,
                root: window.BASE_URL.replace(/^(.*:\/\/)?[^\/]*\/?/, ''), // strip host and port and beginning /
                silent: false
            })) {
                $('#app').html('page not found');
            }
        };

        return {
            initialize: initialize
        };  
});