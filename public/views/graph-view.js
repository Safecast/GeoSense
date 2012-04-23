window.GraphView = Backbone.View.extend({

    tagName: 'div',
	className: 'graph-view',
	
    events: {
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('graph'));	
		this.vent = options.vent;
		this.mapParams = {};

		$(window).bind("resize", _.bind(this.resize, this));
		
		_.bindAll(this, "drawGraph");
		this.vent.bind("drawGraph", this.drawGraph);

		_.bindAll(this, "updateGraphCollections");
		this.vent.bind("updateGraphCollections", this.updateGraphCollections);
		
		this.collections = {}; //Bound collections
		this.graphPoints = []; //Used to keep count through addOne
		this.graphPointCollection = []; //Array of point collection objects (post addOne)
		this.graphSeries = [] //Passed to graph during draw

		this.fetchMapCollectionOptions();
    },

    render: function() {
		$(this.el).html(this.template());
        return this;
    },

    fetchMapCollectionOptions: function()
	{
		var self = this;
		$.ajax({
			type: 'GET',
			url: '/api/map/' + _mapId,
			success: function(data) {
				
				$.each(data[0].collections, function(key, collection) { 
					self.mapParams[collection.collectionid] = collection;
				});
			},
			error: function() {
				console.error('failed to fetch map collection');
			}
		});
	},

	addCollection: function(id, collection)
	{
		var self = this;
		this.collections[id] = collection;
		this.collections[id].bind('reset', this.reset, this);
		this.collections[id].bind('add', this.addOne, this);
		this.addCollectionToGraph(this.collections[id]);
	},

	updateGraphCollections: function(visibleMapArea)
	{

		var self = this;
		console.log('updating graph collection!');

		$.each(this.collections, function(collectionid, collection) { 
			collection.setVisibleMapArea(visibleMapArea);
			collection.fetch();
		});
		
		this.graphSeries = [];

		$.each(this.graphPointCollection, function(key, link) { 

			series = {
				color: self.graphPointCollection[key].color,
				data: self.graphPointCollection[key].points,
				name: 'Test'
			}

			self.graphSeries.push(series);
		});


		if(this.graph == undefined)
		 	return;

		//TODO: Update graph, not redraw!
		this.drawGraph();
	},

	buildGraphPointCollection: function()
	{
		
	},
	
	addCollectionToGraph: function(collection)
	{
		var self = this;
		var currCollection = collection.collectionId;

		this.graphPoints = [];	

		collection.each(function(model) {
			self.addOne(model, currCollection);
		});

		var defaults = self.mapParams[currCollection].defaults
		var colorType = defaults.colorType;

		if(colorType == 1)
		{
			var color = defaults.color;

		} else
		{
			var color = defaults.colorLow;
		}

		this.graphPointCollection.push(
		{
			points: this.graphPoints,
			color: color
		});
	},

	resize: function()
	{
		if(this.graph)
			this.graph.update({
	   			width: $('#graphContainer').width(),
	    		height: $('#graphContainer').height()
			});
	},
	
	updateGraph: function()
	{
		//this.graph.update();
	},
	
	drawGraph: function()
	{
		var self = this;
		
		this.$('#chart').empty();
		this.$('#legendContainer').empty();
		this.$('#legend').empty();
		this.$('#smoother').empty();
				
		this.graph = new Rickshaw.Graph( {
			element: document.getElementById("chart"),
			width: this.$('#graphContainer').width(),
			height: 300,
			renderer: 'area',
			series: self.graphSeries,
		} );


		var yAxis = new Rickshaw.Graph.Axis.Y({
		    graph: this.graph,
		    tickFormat: Rickshaw.Fixtures.Number.formatKMBT
		});

		var axes = new Rickshaw.Graph.Axis.Time( {
			graph: this.graph
		} );
		
		var hoverDetail = new Rickshaw.Graph.HoverDetail( {
			graph: this.graph
		});
		
		var slider = new Rickshaw.Graph.RangeSlider( {
			graph: this.graph,
			element: $('#slider')
		});
		
		this.$('#slider').css('margin-left',7)
		this.$('#slider').width($('#graphContainer').width() - 30);

		// var legend = new Rickshaw.Graph.Legend({
		//     graph: this.graph,
		//     element: $('#graph').get(0),
		// });

		this.graph.render();


		axes.render();
		yAxis.render();
		
	},

    addOne: function(model, pointCollectionId) {
		var self = this;
				
		//Prep point for graph	
		var collectionId = pointCollectionId; 
		var name = model.get('name');
		var val = model.attributes.val;

		var colorlow = model.attributes.colorlow;
		var colorhigh = model.attributes.colorhigh;
		var date = model.attributes.datetime;
		var epoch = new Date(date).getTime()/1000;

		//Set min/max values		
		var maxVal = this.collections[collectionId].maxVal;
		var minVal = this.collections[collectionId].minVal;
		var normVal = val/maxVal;
		
		//console.log(epoch + " | " + normVal);

		var data = { x: epoch, y: val, date: date, color:this};
		
		this.graphPoints.push(data);	
    },

	reset: function(collection) {
		//this.removeCollectionFromMap(model);

		this.graphPointCollection = []
		this.addCollectionToGraph(collection);
	},
});