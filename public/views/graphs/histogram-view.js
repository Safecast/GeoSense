define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/histogram.html',
	'views/graphs/graph-view-base',
	'd3',
], function($, _, Backbone, config, utils, templateHtml, GraphViewBase, d3) {
    "use strict";

	var HistogramView = GraphViewBase.extend({

		className: 'graph histogram',
	    events: {
	    },

	    initialize: function(options) 
	    {
	    	var self = this,
	    		options = _.extend({renderAxes: true}, options);
	    	HistogramView.__super__.initialize.call(this, options);
	    	this.template = _.template(templateHtml);
	    },

		renderGraph: function() 
		{
			var self = this;
			if (!this.collection.length) return this;

		    HistogramView.__super__.renderGraph.apply(this, arguments);

			var numBins = 222,
				data = this.collection.models,
				extremes = this.model.getMappedExtremes(),
				getBin = function(d) { 
					return d.attributes.properties.bin;
				},
				getCount = function(d) { 
					return d.attributes.properties.count || 0;
				},
				getVal = function(d) { 
					var val = d.getNumericVal();
					return val.avg ? val.avg : val;
				};

			var	x = d3.scale.linear()
			    	.range(this.getXRange())
			    	//.domain(d3.extent(data, getBin)),
			    	.domain([extremes.numeric.min, extremes.numeric.max]),
				y = d3.scale.linear()
			    	.range(this.getYRange())
			    	.domain(d3.extent(data, getCount));

			if (this.renderAxes) {
				var xAxis = d3.svg.axis()
					    .scale(x)
					    //.ticks(d3.time.years, 10)
					    .orient("bottom"),
					yAxis = d3.svg.axis()
				    	.scale(y)
				    	.orient("left");

				this.svg.append("g")
				    .attr("class", "axis")
				    .attr("transform", "translate(0, "+(this.graphHeight - this.graphMargins.bottom)+")")
				    .call(xAxis)
					.append("text")
					      .attr("class", "label")
					      .attr("x", this.graphWidth - this.graphMargins.right)
					      .attr("y", -6)
					      .style("text-anchor", "end")
					      .text(this.model.getDisplay('unit'));

				this.svg.append("g")
				    .attr("class", "axis")
				    .attr("transform", "translate("+(this.graphMargins.left)+", 0)")
				    .call(yAxis)
					.append("text")
					      .attr("class", "label")
					      .attr("x", 0)
					      .attr("y", 12)
					      .style("text-anchor", "left")
						  .text(this.model.getDisplay('itemTitlePlural'))				    
			}
			
			this.svg.selectAll("rect")
					.data(data)
				.enter().append("rect")
			    	.attr("x", function(d, i) { 
			    		return x(getVal(d))
			    	})
			    	.attr("y", function(d, i) { return y(getCount(d)) })
			     	.attr("height", function(d, i) { 
			     		return self.graphHeight - y(getCount(d)) - self.graphMargins.bottom;
			     	})
			     	.attr("width", this.graphWidth / numBins)
			     	.attr("class", "crisp")
			     	.style("fill", function(d, i) {
			     		return d.getRenderAttributes('color');
			     	});

			return this;
		},

	});

	return HistogramView;
});