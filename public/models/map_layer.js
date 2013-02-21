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

        getDataStatus: function()
        {
            return this.attributes.featureCollection.status;
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
            this.featureCollection = new GeoFeatureCollection([], {mapLayer: this});
            this.valFormatters = [];

            this.sessionOptions = _.extend(options.sessionOptions || {}, {
                enabled: (this.attributes.layerOptions ?
                    this.attributes.layerOptions.enabled : true),
                valFormatterIndex: 0
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

        getLayerOptions: function()
        {
            return this.attributes.layerOptions;
        },

        getExtremes: function()
        {
            return {
                minVal: this.attributes.featureCollection.minVal, 
                maxVal: this.attributes.featureCollection.maxVal,
                maxCount: this.featureCollection.maxReducedCount
            };
        },

        colorAt: function(pos)
        {
            if (!this._colorGradient) {
                this._colorGradient = new ColorGradient(this.getNormalizedColors());
            }
            return this._colorGradient.colorAt(pos, COLOR_GRADIENT_STEP);
        },

        getNormalizedColors: function(originalColors) 
        {
            var self = this,
                originalColors = originalColors || this.attributes.layerOptions.colors,
                extremes = this.getExtremes();
            if (!this._normalizedColors) {
                this._normalizedColors = originalColors.map(function(c) {
                    var p = parseFloat(c.position),
                        p = isNaN(p) ? 1 : p,
                        sc = (c.position || '') + '';
                    return _.extend({}, c, {
                        position: sc[sc.length - 1] == '%' ?
                            p / 100 : (p - extremes.minVal) / (extremes.maxVal - extremes.minVal)
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

        isNumeric: function()
        {
            return this.attributes.featureCollection.isNumeric 
                && this.attributes.featureCollection.maxVal != undefined 
                && this.attributes.featureCollection.minVal != undefined;
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
            var c1 = this.previousAttributes().layerOptions.colors, 
                c2 = this.attributes.layerOptions.colors;
            return this.hasChanged('layerOptions.colorLabelColor') || (c1 && c2 && !_.isEqual(c1, c2));
        }

    });

    return MapLayer;
});