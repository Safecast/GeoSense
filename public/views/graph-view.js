window.GraphView = Backbone.View.extend({

    tagName: 'div',
	className: 'graph-view',
	
    events: {
		'click #testButton': 'testButtonClicked',
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('graph'));	
		this.vent = options.vent;
		$(window).bind("resize", _.bind(this.resize, this));
    },

    render: function() {
		$(this.el).html(this.template());
        return this;
    },

	testButtonClicked: function()
	{
		var data = this.generateData();
		
		d3.select($('#graphContainer svg').get(0))
			    .attr('width', this.getWidth())
			    .attr('height', this.getHeight())
				.datum(data)
			    .call(this.chart);
	},

	getWidth: function()
	{
		return 5000;
		//return parseInt(d3.select(this.$('#graphContainer').get(0)).style('width'));
	},
	
	getHeight: function()
	{
		return parseInt(d3.select(this.$('#graphContainer').get(0)).style('height'))
	},

	resize: function()
	{
		this.updateGraph();
	},
	
	updateGraph: function()
	{
		d3.select($('#graphContainer svg').get(0))
			    .attr('width', this.getWidth())
			    .attr('height', this.getHeight())
			    .call(this.chart);
	},
	
	generateData: function()
	{
		var n = 3, // number of layers
		    m = 120; // number of samples per layer
		
		var data = this.stream_layers(n,m).map(function(data, i) {
		  return { 
		    key: 'Stream' + i,
		    values: data
		  };
		});
		return data	
	},

	drawGraph: function()
	{		

		//format data to our liking, add keys
		var data = this.generateData();
		
		this.chart = nv.models.stackedAreaWithLegend()
		            .width(this.getWidth())
		            .height(this.getHeight())
		
		var svg = d3.select($('#graphContainer svg').get(0))
		  .attr('width', this.getWidth())
		  .attr('height', this.getHeight())
		  .datum(data)
		
		svg.transition().duration(500).call(this.chart);
		
		/*
		this.chart.dispatch.on('tooltipShow', function(e) {
		  var offset = $('#chart').offset(),
		      left = e.pos[0] + offset.left,
		      top = e.pos[1] + offset.top,
		      formatterY = this.chart.stacked.offset() == 'expand' ? d3.format(',.2%') : d3.format(',.2f'), //TODO: stacked format should be set by caller
		      formatterX = function(d) { return d };

		  var content = '<h3>' + e.series.key + '</h3>' +
		                '<p>' +
		                formatterY(this.chart.y()(e.point)) + ' on ' + formatterX(this.chart.x()(e.point)) +
		                '</p>';

		  nvtooltip.show([left, top], content);
		});

		this.chart.dispatch.on('tooltipHide', function(e) {
		  nvtooltip.cleanup();
		});	
		*/
		/////
		
	},
	
	stream_layers: function(n, m, o) {
	  if (arguments.length < 3) o = 0;
	  function bump(a) {
	    var x = 1 / (.1 + Math.random()),
	        y = 2 * Math.random() - .5,
	        z = 10 / (.1 + Math.random());
	    for (var i = 0; i < m; i++) {
	      var w = (i / m - y) * z;
	      a[i] += x * Math.exp(-w * w);
	    }
	  }
	  return d3.range(n).map(function() {
	      var a = [], i;
	      for (i = 0; i < m; i++) a[i] = o + o * Math.random();
	      for (i = 0; i < 5; i++) bump(a);
	      return a.map(stream_index);
	    });
		function stream_index(d, i) {
		  return {x: i, y: Math.max(0, d)};
		}
	},
});