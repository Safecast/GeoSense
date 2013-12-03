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
	    	var self = this;
	    	this.renderAxes = options.renderAxes;
	    	if (this.renderAxes) {
				this.graphMargins = {top: 20, right: 30, bottom: 20, left: 50};
	    	} else {
				this.graphMargins = {top: 0, right: 0, bottom: 0, left: 0};
	    	}
			this.viewWidth = undefined;
			this.viewHeight = undefined;
			this.graphRendered = false;
			if (this.collection) {
				this.listenTo(this.collection, 'reset', function() {
					self.redrawGraphIfVisible();
				});
			}
	    },

	    fillExtents: function()
	    {
	    	var parentWidth = this.$el.parent().innerWidth();
	    	if (parentWidth) {
		    	this.$el.css({
		    		width: this.$el.parent().innerWidth() + 'px'
		    	});
	    	}
			this.setViewSize(this.$el.innerWidth(), this.$el.innerHeight());
	    	return this;
	    },

	    setViewSize: function(width, height)
	    {
	    	this.viewWidth = width;
	    	this.viewHeight = height;
		    this.graphWidth = this.viewWidth - this.graphMargins.left - this.graphMargins.right;
		    this.graphHeight = this.viewHeight - this.graphMargins.top - this.graphMargins.bottom;
	    },

	    appendSVG: function()
	    {
			return d3.select(this.el).append("svg")
			    .attr("width", this.viewWidth)
			    .attr("height", this.viewHeight)
			    .append("g")
    				.attr("transform", "translate(" + this.graphMargins.left + "," + this.graphMargins.top + ")");
		},

	    getXRange: function()
	    {
	    	return [0, this.graphWidth];
	    },

	    getYRange: function()
	    {
	    	return [this.graphHeight, 0];
	    },

	    appendXAxis: function(xAxis, title) 
	    {
			return this.svg.append("g")
			    .attr("class", "axis")
			    .attr("transform", "translate(0, " + this.graphHeight + ")")
			    .call(xAxis)
				.append("text")
					.attr("class", "label contrast")
					.attr("x", this.graphWidth)
					.attr("y", -6)
					.style("text-anchor", "end")
					.text(title);
	    },

	    appendYAxis: function(yAxis, title) 
	    {
			return this.svg.append("g")
			    .attr("class", "axis")
			    .call(yAxis)
				.append("text")
					.attr("class", "label contrast")
					.attr("x", 10)
					.attr("y", -6)
					.style("text-anchor", "left")
					.text(title)
	    },

	    showTooltip: function(element, title)
	    {
	    	var self = this;
			$(element)
				.tooltip({
					title: title,
					container: self.$el,
				})
				.tooltip('show')
				.on('hidden.bs.tooltip', function() {
					$(element).off().tooltip('destroy');
				});
	    },

		render: function()
		{	
			$(this.el).html(this.template());
			return this;
		},

		renderGraph: function()
		{
			if (!this.__suppressLog) {
	            console.log('Rendering graph for ', this.model.id, this.model.getDisplay('title'));
			}
		    this.trigger('graph:render');
		    this.graphRendered = true;
			if (!this.viewWidth) {
				this.fillExtents();
			}
			this.$el.empty();
			this.svg = this.appendSVG();
			return this;
		},

		redrawGraph: function()
		{
            console.log('Redrawing graph for ', this.model.id, this.model.getDisplay('title'));
		    this.trigger('graph:redraw');
		    this.__suppressLog = true;
			this.renderGraph();
		    this.__suppressLog = false;
			return this;
		},

		graphVisible: function()
		{
			return this.$el.is(':visible');
		},

	    redrawGraphIfVisible: function()
	    {
			if (this.graphVisible()) {
				this.redrawGraph();
			}
			return this;
	    },

		show: function() 
		{
			if (!this.collection.visibleMapAreaFetched) {
				this.collection.fetch();
			}
			this.$el.show();
			this.redrawGraph();
		},

		hide: function() {
			this.$el.hide();
		}

	});

	return GraphViewBase;
});