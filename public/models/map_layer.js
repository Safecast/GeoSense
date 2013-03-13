define([
    'jquery',
    'underscore',
    'backbone',
    'collections/geo-feature-collection',
    'lib/color-gradient/color-gradient',
    'deepextend',
    'deepmodel',
], function($, _, Backbone, GeoFeatureCollection, ColorGradient) {
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

        getFeatureCollectionAttr: function(name, def)
        {
            return this.attributes.featureCollection ?
                this.attributes.featureCollection[name] 
                : (def != undefined ? def : null);
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
                defaults = collection ? collection.defaults : {};

                return options
                    && options[attrName] 
                    && (typeof(options[attrName]) != 'string' || options[attrName].length) ?
                        options[attrName]
                    : collection ?
                        collection[attrName]
                        : defaults ?
                            defaults[attrName]
                                : null;
        },

        initialize: function(attributes, options) 
        {
            var self = this,
                options = options || {};
                
            this.parentMap = options.parentMap;
            if (this.attributes.featureCollection) {
                this.featureCollection = new GeoFeatureCollection([], {mapLayer: this});
            } else {
                var feed = this.getLayerOptions().feed;
                this.featureCollection = new GeoFeatureCollection([], {mapLayer: this, 
                    urlFormat: feed ? feed.url : '',
                    parser: feed ? feed.parser : ''
                });
            }
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
            this.sessionOptions.colorSchemeIndex = index;
            delete this._normalizedColors;
            this.trigger('toggle:colorScheme', this);
        },

        getCounts: function()
        {
            return this.featureCollection.counts;
        },

        isNumeric: function()
        {
            var x = this.getFeatureCollectionAttr('extremes', {}),
                attrMap = this.getFeatureCollectionAttr('attrMap'),
                numAttr = attrMap ? attrMap.numeric : null;
            return numAttr != undefined 
                && getAttr(x, numAttr) != undefined;
        },

        getMappedExtremes: function()
        {
            var x = this.getFeatureCollectionAttr('extremes', {}),
                attrMap = this.getFeatureCollectionAttr('attrMap', {}),
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