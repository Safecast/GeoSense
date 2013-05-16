define([
	'jquery',
	'underscore',
	'backbone',
	'parsers/geojson',
	'parsers/twitter'
], function($, _, Backbone, GeoJSON, Twitter) {

	return {
		GeoJSON: GeoJSON,
		Twitter: Twitter
	};

});
