define([
    'jquery',
    'underscore',
    'backbone',
    'config',
    'utils',
    'text!templates/homepage.html',
    'lib/color-gradient/color-gradient'
], function($, _, Backbone, config, utils, templateHtml, ColorGradient) {
    var MapViewBase = Backbone.View.extend({

        initialize: function(options) 
        {
            this.layers = [];
            this.vent = options.vent;

            if (options.visibleMapArea) {
                this.initialVisibleMapArea = options.visibleMapArea;
            }
        },

        renderMap: function(viewBase, viewStyle) 
        {
            if (this.initialVisibleMapArea) {
                this.visibleAreaChangedInitially = true;
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
            if (!this.visibleAreaChangedInitially) {
                // TODO move to app
                app.navigate(app.genMapURIForVisibleArea(visibleMapArea));
            }
            this.visibleAreaChangedInitially = false;
            console.log('visibleAreaChanged');
            this.trigger('visibleAreaChanged');
        },

        /**
        * Map layer management
        */

        attachLayer: function(model)
        {
            this.layers.push(model);
            this.listenTo(model, 'toggle:enabled', this.layerToggled);
            this.listenTo(model, 'change', this.layerChanged);
            var c = model.featureCollection;
            this.listenTo(c, {
                reset: this.featureReset
            });
            this.listenTo(c, 'add', this.featureAdd);
            this.listenTo(c, 'remove', this.featureRemove);
            this.listenTo(c, 'change', this.featureChange);
            this.listenTo(model, 'destroy', this.destroyLayer);

            this.featureReset(model.featureCollection);
        },

        layerToggled: function(model)
        {
        },

        layerChanged: function(model)
        {
        },

        drawLayer: function(model)
        {
        },

        destroyLayer: function(model)
        {
            this.layers.splice(this.layers.indexOf(model), 1);
            this.stopListening(model);
            this.stopListening(model.featureCollection);
        },

        /**
        * Map feature collection events
        */

        featureReset: function(collection, options) 
        {   
            var self = this;
            collection.each(function(model) {
                self.featureAdd(model);
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
