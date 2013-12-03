define([
    'jquery',
    'underscore',
    'backbone',
    'config',
    'utils',
    'mixins/timeout-queue-mixin',
    'lib/color-gradient/color-gradient'
], function($, _, Backbone, config, utils, TimeoutQueueMixin, ColorGradient) {
    "use strict";

    var MapViewBase = Backbone.View.extend({

        initialize: function(options)
        {
            this.layers = [];
            this.createTimeoutQueue('visibleArea', 250);
            this.featureLayers = {};

            this.on('feature:selected', function(mapLayer, model, feature) {
                mapLayer.trigger('feature:selected', mapLayer, model, feature);
            });
            this.on('feature:unselected', function(mapLayer, model, feature) {
                mapLayer.trigger('feature:unselected', mapLayer, model, feature);
            });
        },

        renderMap: function(viewBase, viewStyle) 
        {
            return this;
        },

        /**
        * Required to be implemented by descendants.
        */
        getVisibleMapArea: function()
        {
            return {
                center: null,
                zoom: null,
                bounds: null
            };
        },
        
        /**
        * Required to be implemented by descendants.
        */
        setVisibleMapArea: function(to) 
        {
        },

        /**
        * Required to be implemented by descendants.
        */
        zoomToExtent: function(bbox) 
        {
        },

        visibleAreaChanged: function(visibleMapArea)
        {
            var self = this;
            this.queueTimeout('visibleArea', function() {
                self.trigger('view:areachanged', this, visibleMapArea);
            });
        },

        /**
        * Required to be implemented by descendants.
        */
        updateViewBase: function(viewBase, viewStyle)
        {
            this.trigger('view:optionschanged', this);
        },

        /**
        * Required to be implemented by descendants.
        */
        updateViewStyle: function(styleName)
        {       
        },

        /**
        * Required to be implemented by descendants.
        */
        updateViewOptions: function(opts) 
        {
        },

        /**
        * Map layer management
        */

        attachLayer: function(model)
        {
            var self = this;

            var featureLayer = this.initFeatureLayer(model);
            if (featureLayer) {
                this.featureLayers[model.id] = featureLayer;
                featureLayer.toggle(model.isEnabled());
            }

            this.layers.push(model);
            this.listenTo(model, 'toggle:enabled', this.layerToggled);
            this.listenTo(model, 'change', function(model, options) {
                if (options.poll) return;
                self.layerChanged(model, options);
            });
            this.listenTo(model, 'toggle:colorScheme', this.layerChanged);
            this.listenTo(model, 'destroy', this.destroyLayer);

            if (featureLayer) {
                featureLayer.featureReset(featureLayer.collection);
            }
        },

        initFeatureLayer: function(model)
        {

        },
        
        getFeatureLayer: function(model)
        {
            return this.featureLayers[model.id];
        },

        layerToggled: function(model)
        {
            var featureLayer = this.getFeatureLayer(model);
            if (featureLayer) {
                featureLayer.toggle(model.isEnabled());
            }
        },

        layerChanged: function(model, options)
        {
        },

        destroyLayer: function(model)
        {
            this.layers.splice(this.layers.indexOf(model), 1);
            this.stopListening(model);
            this.stopListening(model.mapFeatures);

            var featureLayer = this.featureLayers[model.id];
            if (featureLayer) {
                featureLayer.destroy();
            }
            delete this.featureLayers[model.id];
        }

    });

    _.extend(MapViewBase.prototype, TimeoutQueueMixin);

    return MapViewBase;
});
