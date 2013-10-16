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
            this.vent = options.vent;

            if (options.visibleMapArea) {
                this.initialVisibleMapArea = options.visibleMapArea;
            }
        },

        renderMap: function(viewBase, viewStyle) 
        {
            if (this.initialVisibleMapArea) {
                this.setVisibleMapArea(this.initialVisibleMapArea);
            }
            return this;
        },

        /**
        * Required to be implemented by descendants.
        */
        getVisibleMapArea: function()
        {
            return {
                bounds: null,
                zoom: null
            };
        },
        
        /**
        * Required to be implemented by descendants.
        */
        setVisibleMapArea: function(to) {
        },

        visibleAreaChanged: function(visibleMapArea)
        {
            var self = this;
            this.queueTimeout('visibleArea', function() {
                self.trigger('visibleAreaChanged', this, visibleMapArea);
            });
        },

        /**
        * Map layer management
        */

        attachLayer: function(model)
        {
            var self = this;
            this.layers.push(model);
            this.listenTo(model, 'toggle:enabled', this.layerToggled);
            this.listenTo(model, 'change', function(model, options) {
                if (options.poll) return;
                self.layerChanged(model, options);
            });
            this.listenTo(model, 'toggle:colorScheme', this.layerChanged);
            this.listenTo(model.mapFeatures, 'reset', this.featureReset);
            this.listenTo(model.mapFeatures, 'add', this.featureAdd);
            this.listenTo(model.mapFeatures, 'remove', this.featureRemove);
            this.listenTo(model.mapFeatures, 'change', this.featureChange);
            this.listenTo(model, 'destroy', this.destroyLayer);

            this.featureReset(model.mapFeatures);
        },

        layerToggled: function(model)
        {
        },

        layerChanged: function(model, options)
        {
        },

        drawLayer: function(model)
        {
        },

        destroyLayer: function(model)
        {
            this.layers.splice(this.layers.indexOf(model), 1);
            this.stopListening(model);
            this.stopListening(model.mapFeatures);
        },

        /**
        * Map feature collection events
        */

        featureReset: function(collection, options) 
        {   
            var self = this;
            collection.each(function(model) {
                self.featureAdd(model, collection, options);
            });
            self.drawLayer(collection.mapLayer);
        },

        featureAdd: function(model, collection, options)  
        {
        },

        featureRemove: function(model, collection, options) 
        {
        },

        featureChange: function(model, options)
        {
        },

    });

    _.extend(MapViewBase.prototype, TimeoutQueueMixin);

    return MapViewBase;
});
