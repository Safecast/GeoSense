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
			this.queryParams = options.queryParams ? $.extend({}, options.queryParams) : {};
			this.urlFormat = options.urlFormat;
			this.initiallyFetched = this.visibleMapAreaFetched = false;
			this.on('error', function() {
				this.initiallyFetched = false;
			})
		},

		canFetch: function() 
		{
			return this.mapLayer.attributes.featureCollection 
				|| (this.urlFormat != undefined && this.urlFormat != '');
		},

		fetch: function(options) {
			var options = options || {};
			if (this.urlFormat != undefined) {
				options = _.extend(options, {dataType: 'jsonp'});
			}
			return GeoFeatureCollection.__super__.fetch.call(this, options);
		},

		url: function(queryParams) 
		{
			if (this.urlFormat != undefined) {
				var url = this.urlFormat.format(this.urlParams);
				return url;
			}

			/* Example queryParams for time-based:

				queryParams.t = 'w';
				queryParams.from = fromDate.format('%Y-%m-%d');
				queryParams.to = toDate.format('%Y-%m-%d');

			for a bounding box with zoom:

				queryParams.b = [W, S, N, E]
				queryParams.z = 1..20

			*/

			if (!queryParams) {
				var queryParams = {},
					bounds = this.urlParams.bounds;
				if (bounds) {
					queryParams.b = [bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]];
				}
				queryParams.z = this.urlParams.zoom;
			};

			return this.mapLayer.url() + '/features' 
				+ '?' + genQueryString(_.extend(this.queryParams, queryParams));
		},

		setVisibleMapArea: function(visibleMapArea) 
		{
			var bounds = visibleMapArea.bounds;
			this.urlParams = {
				centerX: visibleMapArea.center[0],
				centerY: visibleMapArea.center[1],
				radius: '1km',//TODO visibleMapArea.radius,
				bounds: bounds,
				zoom: visibleMapArea.zoom,
				query: ''
			};
			this.visibleMapAreaFetched = false;
		},

		isCurrent: function() 
		{
			return this.initiallyFetched && this.visibleMapAreaFetched;
		},

	    parse: function(resp, xhr) 
	    {
	    	this.counts = resp.counts || {};
			this.initiallyFetched = this.visibleMapAreaFetched = true;
			return GeoFeatureCollection.__super__.parse.call(this, resp.features, xhr);
	    },
				
	});

	return GeoFeatureCollection;
});