window.GraphView = Backbone.View.extend({

    tagName: 'div',
	className: 'graph-view',
	
    events: {
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('graph'));	
		this.vent = options.vent;
		$(window).bind("resize", _.bind(this.resize, this));
		
		_.bindAll(this, "drawGraph");
		this.vent.bind("drawGraph", this.drawGraph);
		
		this.collections = {};
		this.seriesData = [];
		this.graphData = [];
    },

    render: function() {
		$(this.el).html(this.template());
        return this;
    },

	addCollection: function(id, collection)
	{
		var self = this;
		this.collections[id] = collection;
		this.collections[id].bind('reset', this.reset, this);
		this.collections[id].bind('add', this.addOne, this);
		this.addCollectionToGraph(this.collections[id]);
	},
	
	addCollectionToGraph: function(collection)
	{
		var self = this;
		
		var currCollection = collection.collectionId;
	
		collection.each(function(model) {
			self.addOne(model, currCollection);
		});

		this.graphData.sort(function(a, b){
		 return a.epoch-b.epoch
		});
	},

	resize: function()
	{
		//this.drawGraph();
	},
	
	updateGraph: function()
	{
		this.graph.render();
	},
	
	drawGraph: function()
	{
		// $.each(this.graphData, function(key, val) { 
		// 	console.log(val.date);
		// });
		
		this.seriesData.push(this.graphData);		
		
		var self = this;
		this.$('#chart').empty();
		this.$('#legendContainer').empty();
		this.$('#legend').empty();
		this.$('#smoother').empty();
				
		this.graph = new Rickshaw.Graph( {
			element: $('#chart').get(0),
			width: $('#graphContainer').width(),
			height: 300,
			renderer: 'area',
			series: [
				{
					color: "steelblue",
					data: this.seriesData[0],
					name: 'Earthquakes'
				}
			]
		} );

		var hoverDetail = new Rickshaw.Graph.HoverDetail( {
			graph: this.graph
		});

		// 
		// var legend = new Rickshaw.Graph.Legend( {
		// 	graph: self.graph,
		// 	element: document.getElementById('legend')
		// });
		// 
		// var shelving = new Rickshaw.Graph.Behavior.Series.Toggle( {
		// 	graph: self.graph,
		// 	legend: legend
		// });

		var yAxis = new Rickshaw.Graph.Axis.Y({
		    graph: this.graph,
		    tickFormat: Rickshaw.Fixtures.Number.formatKMBT
		});

		yAxis.render();
		
		var time = new Rickshaw.Fixtures.Time();
		var years = time.unit('year');
		// 
				var xAxis = new Rickshaw.Graph.Axis.Time({
						    graph: this.graph,
						    timeUnit: years
						});
				
						xAxis.render();
		
		var slider = new Rickshaw.Graph.RangeSlider( {
			graph: this.graph,
			element: $('#slider')
		});
		
		var controls = new RenderControls( {
			element: document.querySelector('form'),
			graph: this.graph
		} );
		
		this.graph.render();
		
	},

    addOne: function(model, currIndex) {
		var self = this;
				
		//Prep point for graph	
		var index = currIndex;	
		var collectionId = model.get('collectionid'); 
		var name = model.get('name');
		var location = model.get('location');
		var lat = model.get('lon');
		var lon = model.get('lat');
		var val = model.get('val');
		var colorlow = model.get('colorlow');
		var colorhigh = model.get('colorhigh');
		var date = model.get('date');
		
		//Set min/max values		
		var maxVal = this.collections[collectionId].maxVal;
		var minVal = this.collections[collectionId].minVal;
		
		var dateString = new XDate(Number(date)).toString('M/d/yy');
		//console.log(dateString);
		
		var data = { x: Number(date)/1000, y: Number(val), date: dateString, epoch:Number(date) };
		this.graphData.push(data);	
    },

	reset: function(model) {
		//this.removeCollectionFromMap(model);
		if(model.length > 0)
			console.log('add collection to graph reset')
			//this.addCollectionToMap(this.collections[model.collectionId]);
	},
});