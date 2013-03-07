define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/histogram.html',
	'd3',
], function($, _, Backbone, config, utils, templateHtml, d3) {

	var HistogramView = Backbone.View.extend({

		className: 'histogram',
	    events: {
	    },

	    initialize: function(options) 
	    {
	    	this.template = _.template(templateHtml);
	    },

		render: function()
		{	
			var self = this;
			$(this.el).hide().html(this.template());
			var graphEl = self.$el;

			if (!this.histogramData) {
				$.ajax({
					type: 'GET',
					url: '/api/histogram/' + this.model.attributes.featureCollection._id,
					success: function(data) {
						self.histogramData = data;
						self.render();
					},
					error: function() {
						console.error('failed to fetch histogram');
					}
				});
				return this;
			}

			var data = this.histogramData,
				len = data.length,
				extremes = this.model.getMappedExtremes(),
				minVal = extremes.numeric ? extremes.numeric.min : NaN,
				maxVal = extremes.numeric ? extremes.numeric.max : NaN,
				graphH = graphEl.innerHeight(),
				graphW = graphEl.innerWidth();

			var maxY = data[0].y,
				minY = data[0].y,
				croppedData = [], 
				yValues = [];
			for (var i = 1; i < len; i++) {
				maxY = Math.max(maxY, data[i].y);
				minY = Math.min(minY, data[i].y);
			}				

			var minY0 = (minY != 0 ? minY : 1);
			var yRatio = minY0 / maxY;

			var maxYRatio;
			if (self.model.attributes.layerOptions.cropDistribution) {
				maxYRatio = 1 / graphH * CROP_DISTRIBUTION_RATIO;
			}

			var cropMaxVal;
			/*
			var color = this.colors[this.colors.length - 1];
			if (color.absPosition) {
				cropMaxVal = color.absPosition;
			}*/

			var cropUpperMaxY = !maxYRatio || yRatio > maxYRatio ? 
				maxY : minY0 * 1 / maxYRatio,
				yValues = [],
				histMaxY;

			for (var i = 0; i < len; i++) {
				/*croppedData.push({
					x: data[i].x,
					y: Math.min(cropUpperMaxY, data[i].y)
				});*/
				if (cropMaxVal == null || data[i].val < cropMaxVal) {
					yValues.push(data[i].y);
				}
			}

			/*
			var graph = new Rickshaw.Graph({
				element: graphEl[0],
				renderer: 'bar',
				width: graphW, 
				height: graphH,
				series: [
					{
						data: croppedData,
						color: '#fff' 
					}
				]
			});

			graph.render();
			*/

			graphEl.html('');
			var chart = d3.select(graphEl[0]).append("svg")
			     .attr("class", "chart")
			     .attr("width", graphW)
			     .attr("height", graphH);

			var y = d3.scale.linear()
				.domain([minY, cropUpperMaxY])
				.range([0, graphH])
				.clamp(true);		     
			
			var barW = graphW / yValues.length;
			var maxX = yValues.length - 1;
			chart.selectAll("rect")
					.data(yValues)
				.enter().append("rect")
			    	.attr("x", function(d, i) { return i * barW; })
			    	.attr("y", function(d, i) { return graphH - y(d) })
			     	.attr("height", y)
			     	.attr("width", barW)
			     	.style("fill", function(d, x) {
			     		return self.model.colorAt(x / maxX);
			     	});

			graphEl.append('<span class="graph-max-y">' + cropUpperMaxY + '</span>');

			/*chart.selectAll("line")
			     .data(y.ticks(1))
			   .enter().append("line")
			     .attr("y1", y)
			     .attr("y2", y)
			     .attr("x1", 0)
			     .attr("x2", graphW)
			     .style("stroke", "#666");

			chart.selectAll(".rule")
		    	.data(y.ticks(1))
	   		.enter().append("text")
				.attr("class", "rule")
				.attr("x", 0)
				.attr("y", y)
				.attr("dy", -3)
				.attr("text-anchor", "middle")
				.text(function(d) { return d } );
			*/

			this.$el.show('fast');
			return this;
		}
	});

	return HistogramView;
});