define([
	'jquery',
	'underscore',
	'backbone',
	'models/geo-feature',
], function($, _, Backbone, GeoFeature) {
	var GeoFeatureCollection = Backbone.Collection.extend({

		model: GeoFeature,
		
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
			/* Example urlParams for time-based:

				urlParams.t = 'w';
				urlParams.from = fromDate.format('%Y-%m-%d');
				urlParams.to = toDate.format('%Y-%m-%d');

			for a bounding box with zoom:

				urlParams.b = [W, S, N, E]
				urlParams.z = 1..20

			*/
			return this.mapLayer.url() + '/features' 
				+ '?' + genQueryString(this.urlParams);
		},

		setVisibleMapArea: function(visibleMapArea) 
		{
			console.log('GeoFeatureCollection.setVisibleMapArea '+this.mapLayer.id);	
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
			return GeoFeatureCollection.__super__.parse.call(this, resp, xhr);
	    },
				
	});

	return GeoFeatureCollection;
});