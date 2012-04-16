window.GraphView = Backbone.View.extend({

    tagName: 'div',
	className: 'graph-view',
	
    events: {
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('graph'));	
		this.vent = options.vent;
		$(window).bind("resize", _.bind(this.resize, this));
		
		this.seriesData = [ []];
		this.random = new Rickshaw.Fixtures.RandomData(150);
		
		for (var i = 0; i < 150; i++) {
			this.random.addData(this.seriesData);
		}
		
    },

    render: function() {
		$(this.el).html(this.template());
        return this;
    },

	resize: function()
	{
		this.drawGraph();
	},
	
	updateGraph: function()
	{
		this.graph.render();
	},
	
	drawGraph: function()
	{
		var self = this;
		
		console.log(this.seriesData[0]);
		
		this.$('#chart').empty();
		this.$('#legendContainer').empty();
		this.$('#legend').empty();
		this.$('#smoother').empty();
				
		this.graph = new Rickshaw.Graph( {
			element: $('#chart').get(0),
			width: $('#graphContainer').width(),
			height: 300,
			renderer: 'line',
			series: [
				{
					color: "#ccc",
					data: this.seriesData[0],
					name: 'Earthquakes'
				}
			]
		} );

		this.graph.render();

		var hoverDetail = new Rickshaw.Graph.HoverDetail( {
			graph: self.graph
		} );
		
		var legend = new Rickshaw.Graph.Legend( {
			graph: self.graph,
			element: document.getElementById('legend')

		} );

		var shelving = new Rickshaw.Graph.Behavior.Series.Toggle( {
			graph: self.graph,
			legend: legend
		} );

		var axes = new Rickshaw.Graph.Axis.Time( {
			graph: self.graph
		} );
		axes.render();
		
		var slider = new Rickshaw.Graph.RangeSlider( {
			graph: self.graph,
			element: $('#slider')
		} );
	},
});