define([
    'jquery',
    'underscore',
    'backbone',
    'config',
    'utils',
], function($, _, Backbone) {

    var FeatureLayerBase = Backbone.View.extend({
        
        initialize: function()
        {
            this.listenTo(this.collection, 'reset', this.featureReset);
            this.listenTo(this.collection, 'add', this.featureAdd);
            this.listenTo(this.collection, 'remove', this.featureRemove);
            this.listenTo(this.collection, 'change', this.featureChange);
        },

        addTo: function(parent)
        {
            
        },

        draw: function()
        {

        },

        toggle: function(state)
        {

        },

        destroyFeatures: function()
        {

        },

        destroy: function()
        {
            this.destroyFeatures();
        },

        featureReset: function(collection, options)
        {
        
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

        modelToFeature: function(model)
        {
            return _.extend({model: model}, model.attributes);
        }

    });

    return FeatureLayerBase;

});
