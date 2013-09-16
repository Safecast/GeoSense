define([
	'jquery',
	'underscore',
	'backbone',
	'models/geo-feature',
	'parsers/index',
	'moment'
], function($, _, Backbone, GeoFeature, Parser, moment) {
    "use strict";

	var MapFeatures = Backbone.Collection.extend({

		model: GeoFeature,
		
		comparator: function(point) 
		{
			return point.get('datetime');
		},
		
		initialize: function(models, options) 
		{
			this.mapLayer = options.mapLayer;
			this.queryParams = options.queryParams ? $.extend({}, options.queryParams) : {};
			this.urlParams = options.urlParams ? $.extend({}, options.urlParams) : {};
			this.urlFormat = options.urlFormat;
			this.properties = {};
			if (!options.parser) {
				this.parser = new Parser.GeoJSON(this);
			} else {
				this.parser = new Parser[options.parser](this);
			}
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
			return MapFeatures.__super__.fetch.call(this, options);
		},

		url: function(queryParams) 
		{
			if (this.urlFormat != undefined) {
				var url = this.urlFormat.format(this.urlParams);
				return url;
			}

			/* Example queryParams for time-based:

				queryParams.t = 'w';
				queryParams.from = moment(fromDate).format('YYYY-MM-DD');
				queryParams.to = moment(toDate).format('YYYY-MM-DD');

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
				bounds: bounds,
				zoom: visibleMapArea.zoom,
				centerX: visibleMapArea.center[0],
				centerY: visibleMapArea.center[1],
				radius: visibleMapArea.radius,
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
			this.initiallyFetched = this.visibleMapAreaFetched = true;
			var parsed = this.parser.parse(resp, xhr);
	    	this.properties = parsed.properties;
	    	return parsed.features;
	    },

        getCounts: function()
        {
            return this.properties.counts;
        },

        gridSize: function()
        {
        	return this.properties.gridSize;
        }
				
	});

	return MapFeatures;
});