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
	
		//console.log(collection);
		
		collection.each(function(model) {
			self.addOne(model, currCollection);
		});

		this.graphData.sort(function(a, b){
		 return a.epoch-b.epoch
		});
	},

	resize: function()
	{
		//Replace with a graph update when Rickshaw.js is updated
		this.drawGraph();
	},
	
	updateGraph: function()
	{
		this.graph.update();
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

		var yAxis = new Rickshaw.Graph.Axis.Y({
		    graph: this.graph,
		    tickFormat: Rickshaw.Fixtures.Number.formatKMBT
		});
		
		yAxis.render();
		
		var time = new Rickshaw.Fixtures.Time();
		var years = time.unit('year');
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
			element: $('#side_panel').get(0),
			graph: this.graph
		} );
		
		this.graph.render();
		
		this.$('#slider').css('margin-left',7)
		this.$('#slider').width($('#graphContainer').width() - 30);
	},

    addOne: function(model, pointCollectionId) {
		var self = this;
				
		//Prep point for graph	
		var collectionId = pointCollectionId; 
		var name = model.get('name');

		var location = model.attributes.loc;
		var lon = location[0];
		var lat = location[1];

		var val = model.attributes.val;

		var colorlow = model.attributes.colorlow;
		var colorhigh = model.attributes.colorhigh;
		var date = model.attributes.date;
		
		
		//Set min/max values		
		var maxVal = this.collections[collectionId].maxVal;
		var minVal = this.collections[collectionId].minVal;
		
		normVal = val/maxVal;
		
		epoch = new Date(date).getTime()/1000;
				
		var data = { x: Number(epoch), y: Number(normVal), date: date, color:this};
		//Need to pull color from params
		//console.log(this.collections[collectionId]);
		
		console.log('--- data');
		console.log(data);
		this.graphData.push(data);	
    },

	reset: function(model) {
		//this.removeCollectionFromMap(model);
		if(model.length > 0)
			console.log('add collection to graph: reset')
			//this.addCollectionToMap(this.collections[model.collectionId]);
	},
});