define([
    'jquery',
    'underscore',
    'backbone',
    'models/geo-feature-collection',
    'collections/map-features',
    'collections/histogram',
    'lib/color-gradient/color-gradient',
    'deepextend',
    'deepmodel',
], function($, _, Backbone, GeoFeatureCollection, MapFeatures, Histogram, ColorGradient) {
    "use strict";

    var MapLayer = Backbone.DeepModel.extend({
        
        idAttribute: "_id",
        
        urlRoot: function() 
        {
            return this.parentMap.url() + '/layer';
        },

        getLayerOptions: function() 
        {
            return this.attributes.layerOptions ? 
                this.attributes.layerOptions : {};
        },

        setLayerOptions: function(layerOptions) {
            for (var k in layerOptions) {
                this.set('layerOptions.' + k, layerOptions[k]);
            }
        },

        getFeatureCollectionAttr: function(name, def)
        {
            return this.attributes.featureCollection 
                && this.attributes.featureCollection[name] != undefined ?
                this.attributes.featureCollection[name] 
                : (def != undefined ? def : null);
        },

        getOption: function(name, def)
        {
            var opts = this.attributes.layerOptions;
            if (!opts || opts[name] == undefined) return def;
            return opts[name];
        },

        getNumericField: function()
        {
            var attrMap = this.getOption('attrMap', {});
            return attrMap.numeric;
        },

        limitFeatures: function()
        {
            return this.getFeatureCollectionAttr('limitFeatures', true);
        },

        getDataStatus: function()
        {
            return this.getFeatureCollectionAttr('status', DataStatus.COMPLETE);
        },

        getBbox: function()
        {
            return this.getFeatureCollectionAttr('bbox', []);
        },

        getDisplay: function(attrName)
        {
            var options = this.attributes.layerOptions,
                collection = this.attributes.featureCollection,
                defaults = collection ? collection.defaults : {},

                ret = options
                    && options[attrName] 
                    && (typeof(options[attrName]) != 'string' || options[attrName].length) ?
                        options[attrName]
                    : collection ?
                        collection[attrName]
                        : defaults ?
                            defaults[attrName]
                                : null;

            if (!ret && attrName == 'itemTitle') {
                ret = __('feature');
            } else if (!ret && attrName == 'itemTitlePlural') {
                ret = __('features');
            }
            
            return ret;
        },

        getCounts: function()
        {
            return this.attributes.featureCollection.counts;
        },

        fetchGraphs: function()
        {
            if (this.histogram) {
                this.histogram.fetch();
            }
        },

        createCollection: function(Cls)
        {
            return new Cls([], {mapLayer: this});
        },

        initCollections: function()
        {
            var self = this;
            if (this.attributes.featureCollection) {
                this.mapFeatures = this.createCollection(MapFeatures);
                if (this.getOption('histogram') && this.isNumeric()) {
                    this.histogram = this.createCollection(Histogram);
                }
                if (this.isTimeBased()) {
                    this.timeline = this.createCollection(MapFeatures);
                    this.listenTo(this.mapFeatures, 'reset add remove', function() {
                        // just copy features to timeline on updates
                        self.timeline.resetFrom(self.mapFeatures);
                    });
                }
                this.featureCollection = new GeoFeatureCollection(this.attributes.featureCollection);
                this.on('sync', function() {
                    self.featureCollection.set(self.attributes.featureCollection);
                });
                this.listenTo(this.featureCollection, 'sync change', function(model, options) {
                    self.set({
                        featureCollection: _.clone(this.featureCollection.attributes)
                    }, options);
                });
            } else {
                var feed = this.getLayerOptions().feed;
                this.mapFeatures = new MapFeatures([], {mapLayer: this, 
                    urlFormat: feed ? feed.url : '',
                    parser: feed ? feed.parser : ''
                });
            }
            return this;
        },

        initialize: function(attributes, options) 
        {
            var self = this,
                options = options || {};
                
            this.parentMap = options.parentMap;
            this.valFormatters = [];

            this.sessionOptions = _.extend(options.sessionOptions || {}, {
                enabled: (this.attributes.layerOptions ?
                    this.attributes.layerOptions.enabled : true),
                valFormatterIndex: 0,
                colorSchemeIndex: attributes && attributes.layerOptions ? 
                    attributes.layerOptions.colorSchemeIndex : 0
            });

            this.on('change', this.onChange, this);
            this.initValFormatters();
        },

        onChange: function()
        {
            delete this._normalizedColors;
            delete this._colorGradient;
            this.initValFormatters();
        },

        initValFormatters: function()
        {
            var self = this;
            this.valFormatters = [];
            if (this.attributes.layerOptions 
                && (!this.attributes.layerOptions.unit && (!this.attributes.layerOptions.unit + '').length)
                && this.attributes.layerOptions.valFormat 
                && this.attributes.layerOptions.valFormat.length) {
                    _.each(this.attributes.layerOptions.valFormat, function(format) {
                        self.valFormatters.push(new ValFormatter(format));
                    });
            } else {
                this.valFormatters.push(new ValFormatter({
                    unit: this.getDisplay('unit')
                }));
            }
            this.setValFormatter(Math.min(
                this.valFormatters.length - 1, this.sessionOptions.valFormatterIndex));
        },

        getValFormatter: function()
        {
            return this.valFormatters[this.sessionOptions.valFormatterIndex];
        },

        getValFormatters: function() 
        {
            return this.valFormatters;
        },

        setValFormatter: function(index)
        {
            this.sessionOptions.valFormatterIndex = index;
            this.trigger('toggle:valFormatter', this);
        },

        setColorScheme: function(index)
        {
            delete this._normalizedColors;
            delete this._colorGradient;
            this.sessionOptions.colorSchemeIndex = index;
            this.trigger('toggle:colorScheme', this);
        },

        isNumeric: function()
        {
            var x = this.getFeatureCollectionAttr('extremes', {}),
                attrMap = this.getOption('attrMap', {}),
                numAttr = attrMap.numeric;
            return numAttr != undefined 
                && getAttr(x, numAttr) != undefined;
        },

        isTimeBased: function()
        {
            var x = this.getFeatureCollectionAttr('extremes', {}),
                attrMap = this.getOption('attrMap', {}),
                datetimeAttr = attrMap.datetime;
            return datetimeAttr != undefined 
                && getAttr(x, datetimeAttr) != undefined;
        },

        hasGraphs: function() 
        {
            return this.isTimeBased() || this.histogram != undefined;
        },

        getMappedExtremes: function()
        {
            var x = this.getFeatureCollectionAttr('extremes', {}),
                attrMap = this.getOption('attrMap', {}),
                r = {};

            for (var k in attrMap) {
                r[k] = getAttr(x, attrMap[k]);
            }
            return r;
        },

        colorAt: function(pos)
        {
            if (!this._colorGradient) {
                this._colorGradient = new ColorGradient(this.getNormalizedColors());
            }
            return this._colorGradient.colorAt(pos, COLOR_GRADIENT_STEP);
        },

        getColorScheme: function(index)
        {
            var index = index != undefined ? index : this.sessionOptions.colorSchemeIndex,
                schemes = this.getLayerOptions().colorSchemes;
            if (!schemes) {
                return {colors: []};
            }
            if (!index) return schemes[0];
            return schemes[index];
        },

        getNormalizedColors: function(originalColors) 
        {
            var self = this,
                originalColors = originalColors || this.getColorScheme().colors,
                extremes = this.getMappedExtremes();
            if (!this._normalizedColors) {
                this._normalizedColors = originalColors.map(function(c) {
                    var p = parseFloat(c.position),
                        p = isNaN(p) ? 1 : p,
                        sc = (c.position || '') + '';
                    return _.extend({}, c, {
                        position: sc[sc.length - 1] == '%' ?
                            p / 100 
                            : (extremes.numeric ?
                                (p - extremes.numeric.min) / (extremes.numeric.max - extremes.numeric.min)
                                : 0)
                    });
                });
            }
            return this._normalizedColors;
        },

        toggleEnabled: function(enabled)
        {
            if (this.sessionOptions.enabled != enabled) {
                this.sessionOptions.enabled = enabled;
                this.trigger('toggle:enabled', this);
            }
        },

        isEnabled: function()
        {
            return this.sessionOptions.enabled;
        },

        canDisplayValues: function()
        {
            var s = this.getDataStatus();
            return s == DataStatus.COMPLETE
                || s == DataStatus.UNREDUCED_INC
                || s == DataStatus.REDUCING
                || s == DataStatus.REDUCING_INC
                || s == DataStatus.IMPORTING_INC;
        },

        hasChangedColors: function()
        {
            var prev = this.previousAttributes();
            if (!prev.layerOptions) return true;
            var c1 = prev.layerOptions.colorSchemes, 
                c2 = this.attributes.layerOptions.colorSchemes;

            return this.hasChanged('layerOptions.colorLabelColor') || (c1 && c2 && !_.isEqual(c1, c2));
        }

    });

    return MapLayer;
});