define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
], function($, _, Backbone, config, utils) {
    "use strict";

	var GraphViewBase = Backbone.View.extend({

		className: 'graph',

	    initialize: function(options) 
	    {
			this.graphMargins = {top: 0, right: 0, bottom: 0, left: 0};
			this.graphWidth = undefined;
			this.graphHeight = undefined;
			this.graphRendered = false;
			if (this.collection) {
				this.listenTo(this.collection, 'sync', this.renderGraph);
			}
	    },

	    fillExtents: function()
	    {
			this.graphWidth = this.$el.innerWidth();
		    this.graphHeight = this.$el.innerHeight();
	    	return this;
	    },

	    appendSVG: function()
	    {
			return d3.select(this.el)
				.append("svg")
			    .attr("width", this.graphWidth)
			    .attr("height", this.graphHeight);
		},

	    getXRange: function()
	    {
	    	return [this.graphMargins.left, this.graphWidth - this.graphMargins.right];
	    },

	    getYRange: function()
	    {
	    	return [this.graphHeight - this.graphMargins.bottom, this.graphMargins.top];
	    },

		render: function()
		{	
			$(this.el).html(this.template());
			return this;
		},

		renderGraph: function()
		{
			console.log('Rendering graph');
		    this.trigger('graph:render');
		    this.graphRendered = true;
			if (!this.graphWidth) {
				this.fillExtents();
			}
			this.$el.empty();
			this.svg = this.appendSVG();
		},

		redrawGraph: function()
		{
			console.log('Redrawing graph');
		    this.trigger('graph:redraw');
			this.renderGraph();
		},

		show: function() 
		{
			if (!this.$el.is(':visible')) {
				this.redrawGraph();
			}
			this.$el.show();
		},

		hide: function() {
			this.$el.hide();
		}

	});

	return GraphViewBase;
});