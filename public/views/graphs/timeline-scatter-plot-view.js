define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/scatter-plot.html',
	'views/graphs/graph-view-base',
	'd3',
], function($, _, Backbone, config, utils, templateHtml, GraphViewBase, d3) {
    "use strict";

	var TimelineScatterPlotView = GraphViewBase.extend({

		className: 'graph scatter-plot',
	    events: {
	    },

	    initialize: function(options) 
	    {
	    	var self = this,
	    		options = _.extend({renderAxes: true}, options);
	    	TimelineScatterPlotView.__super__.initialize.call(this, options);
	    	this.template = _.template(templateHtml);
	    },

		renderGraph: function()
		{	
		    TimelineScatterPlotView.__super__.renderGraph.apply(this, arguments);

			var data = this.collection.models,
				getXVal = function(d) { 
					var v = d.getDatetimeVal(), 
						v = v.min != undefined ? v.min : v
					return v != undefined ? new Date(v) : null;
				},
				getYVal = function(d) { 
					var v = d.getNumericVal(); 
					return v.avg != undefined ? v.avg : v;
				};

			var x = d3.time.scale()
			    	.range(this.getXRange())
			    	.domain(d3.extent(data, getXVal)),
				y = d3.scale.linear()
			    	.range(this.getYRange())
			    	.domain(d3.extent(data, getYVal));

			if (this.renderAxes) {
				var xAxis = d3.svg.axis()
					    .scale(x)
					    //.ticks(d3.time.years, 10)
					    .orient("bottom"),
					yAxis = d3.svg.axis()
				    	.scale(y)
				    	.tickFormat(function(d,i) {
				    		return autoFormatNumber(d);
				    	})
				    	.orient("left");

				this.svg.append("g")
				    .attr("class", "axis")
				    .attr("transform", "translate(0, "+(this.graphHeight - this.graphMargins.bottom)+")")
				    .call(xAxis);
				 
				this.svg.append("g")
				    .attr("class", "axis")
				    .attr("transform", "translate("+(this.graphMargins.left)+", 0)")
				    .call(yAxis)
					.append("text")
					      .attr("class", "label")
					      .attr("x", 0)
					      .attr("y", 12)
					      .style("text-anchor", "left")
						  .text(this.model.getDisplay('unit'))				    
			}

			this.svg.selectAll("circle")
        		.data(data)
        		.enter()
        		.append("circle")
        		.attr("class", "dot")
        		.attr("fill", function(d) {
        			return d.getRenderAttributes().color;
        		})
        		.attr("stroke", function(d) {
        			return d.getRenderAttributes().darkerColor;
        		})
        		.attr("cx", function (d) { return x(getXVal(d)); })
        		.attr("cy", function (d) { return y(getYVal(d)); })
        		.attr("r", function (d) { return 3; })
        		.on("click", function(d) {
        		//	d.collection.setFilter('$datetime', getXVal(d));
        		});
        		

			return this;
		}
	});

	return TimelineScatterPlotView;
});