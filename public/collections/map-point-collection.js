define([
	'jquery',
	'underscore',
	'backbone',
	'models/point',
], function($, _, Backbone, Point) {
	var MapPointCollection = Backbone.Collection.extend({

		model: Point,
		
		comparator: function(point) 
		{
			return point.get('datetime');
		},
		
		initialize: function(models, options) 
		{
			this.mapLayer = options.mapLayer;
			this.mapLayer = options.mapLayer;
			this.urlParams = options.urlParams ? $.extend({}, options.urlParams) : {};
			this.initiallyFetched = this.visibleMapAreaFetched = false;
			this.on('error', function() {
				this.initiallyFetched = false;
			})
		},

		url: function() 
		{
			return this.mapLayer.url() + '/features' 
				+ '?' + genQueryString(this.urlParams);
		},

		setVisibleMapArea: function(visibleMapArea) 
		{
			console.log('MapPointCollection.setVisibleMapArea '+this.mapLayer.id);	
			this.urlParams.b = [visibleMapArea.bounds[0][0], visibleMapArea.bounds[0][1], visibleMapArea.bounds[1][0], visibleMapArea.bounds[1][1]];
			this.urlParams.z = visibleMapArea.zoom;
			this.visibleMapAreaFetched = false;
		},

		isCurrent: function() 
		{
			return this.initiallyFetched && this.visibleMapAreaFetched;
		},

	    parse: function(resp, xhr) 
	    {
	    	if (resp['items']) {
	    		this.fullCount = resp.fullCount;
	    		this.maxReducedCount = resp.maxReducedCount;
	    		this.resultCount = resp.resultCount;
	    		this.originalCount = resp.originalCount;
	    		this.gridSize = resp.gridSize;
	    		resp = resp['items'];
	    	}
			this.initiallyFetched = this.visibleMapAreaFetched = true;
			return MapPointCollection.__super__.parse.call(this, resp, xhr);
	    },
				
	});

	return MapPointCollection;
});