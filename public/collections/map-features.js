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
			});
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
			this.initiallyFetched = this.visibleMapAreaFetched = true;
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
				queryParams.z = 0..19

			*/

			if (!queryParams) {
				var queryParams = {},
					bounds = this.urlParams.bounds;
				if (bounds) {
					queryParams.b = [bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]];
				}
				if (this.urlParams.zoom != undefined) {
					queryParams.z = this.urlParams.zoom;
				}
				if (this.urlParams.original) {
					queryParams.o = this.urlParams.original = 1; 
				}
			};

			return this.mapLayer.url() + '/features' 
				+ '?' + genQueryString(_.extend(this.queryParams, queryParams));
		},

		resetFrom: function(collection)
		{
			this.reset(collection.models);
			this.visibleMapAreaFetched = collection.visibleMapAreaFetched;
            this.urlParams = _.clone(collection.urlParams);
		},

		setVisibleMapArea: function(visibleMapArea) 
		{
			var prevUrlParams = _.clone(this.urlParams);
			this.urlParams.bounds = visibleMapArea.bounds;
			this.urlParams.zoom = visibleMapArea.zoom;
			this.visibleMapAreaFetched = _.isEqual(prevUrlParams, this.urlParams);
		},

		isCurrent: function() 
		{
			return this.initiallyFetched && this.visibleMapAreaFetched;
		},

	    parse: function(resp, xhr) 
	    {
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