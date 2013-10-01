define([
    'jquery',
    'underscore',
    'backbone',
    'config',
    'utils',
    'lib/color-gradient/color-gradient'
], function($, _, Backbone, config, utils, ColorGradient) {
    "use strict";

    var MapViewBase = Backbone.View.extend({

        initialize: function(options) 
        {
            this.layers = [];
            this.redrawQueue = [];
            this.vent = options.vent;

            if (options.visibleMapArea) {
                this.initialVisibleMapArea = options.visibleMapArea;
            }
            console.log('INITIAL', this.initialVisibleMapArea);
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
            console.log('* mapView.visibleAreaChanged');
            var self = this;
            self.redrawQueue.push(setTimeout(function() {
                self.trigger('visibleAreaChanged', this, visibleMapArea);
            }, 250));
            for (var i = self.redrawQueue.length; i > 1; i--) {
                clearTimeout(self.redrawQueue.shift());
            }
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

    return MapViewBase;
});
