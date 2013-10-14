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
			var self = this,
				valFormatter = this.model.getValFormatter();

		    HistogramView.__super__.renderGraph.apply(this, arguments);

			var numBins = this.collection.properties.numBins, 
				binSize = this.collection.properties.binSize, 
				data = this.collection.models,
				extremes = this.model.getMappedExtremes(),
				getCount = function(d) { 
					return d.attributes.count || 0;
				},
				getVal = function(d) { 
					var v = d.getNumericVal();
						v = v.avg ? v.avg : v;
					return v;
				},
				yExtent = d3.extent(data, getCount),
				yScale = yExtent[0] / yExtent[1] < 1 / 10000 ? 'log' : 'linear';

			var	x = d3.scale.linear()
			    	.range(this.getXRange())
			    	.domain([extremes.numeric.min, extremes.numeric.max]),
				y = d3.scale[yScale]()
			    	.range(this.getYRange())
			    	.domain(d3.extent(data, getCount)),
			    binWidth = this.graphWidth / numBins;

			this.svg.selectAll("rect")
					.data(data)
				.enter().append("rect")
			    	.attr("x", function(d, i) { 
			    		return x(getVal(d))
			    	})
			    	.attr("y", function(d, i) { return y(getCount(d)) })
			     	.attr("height", function(d, i) { 
			     		return self.graphHeight - y(getCount(d));
			     	})
			     	.attr("width", binWidth)
			     	.attr("class", "crisp")
			     	.style("fill", function(d, i) {
			     		return d.getRenderAttr('color');
			     	})
        		.on('mouseover', function(d) {
        			var _this = this,
        				count = getCount(d),
        				min = getVal(d),
        				max = min + binSize;
		        	self.showTooltip(this, __('%(count)s %(title)s between %(min)s–%(max)s', {
						count: autoFormatNumber(count),
						title: count != 1 ? self.model.getDisplay('itemTitlePlural') : self.model.getDisplay('itemTitle'),
						min: valFormatter.format(min),
						max: valFormatter.format(max),
					}));
					d3.select(this)
						.style('fill', d.getRenderAttr('hightlightColor', function() {
							return highlightForColor(d.getRenderAttr('color'));
						}));
        		})
        		.on('mouseout', function(d) {
					d3.select(this)
						.style('fill', d.getRenderAttr('color'));
        		});

			if (this.renderAxes) {
				var xAxis = d3.svg.axis()
					    .scale(x)
					    .orient("bottom")
					    .tickFormat(function(v) {
					    	return valFormatter.format(v);
				    	}),
					yAxis = d3.svg.axis()
				    	.scale(y)
				    	.orient("left");

				this.appendXAxis(xAxis, valFormatter.unit);
				this.appendYAxis(yAxis, this.model.getDisplay('itemTitlePlural'));
			}

			return this;
		},

	});

	return HistogramView;
});