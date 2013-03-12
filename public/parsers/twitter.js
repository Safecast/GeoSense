define([
	'jquery',
	'underscore',
	'backbone',
], function($, _, Backbone) {

	var Parser = function(collection) {
		this.collection = collection;
	};

	Parser.prototype.parse = function(resp, xhr)
	{
		var features = [];
		_.each(resp.results, function(result) {
			if (result.geo) {
				var coordinates = [result.geo.coordinates[1], result.geo.coordinates[0]];
				features.push({
					type: 'Feature',
					geometry: {
						type: 'Point',
						coordinates: coordinates
					},
					bbox: [coordinates[0], coordinates[1], coordinates[0], coordinates[1]],
					properties: {
						description: result.text,
						created_at: new Date(result.created_at),
						label: result.from_user_name
					}

				});
			}
		});
		return {
			features: features,
			counts: {
				result: features.length,
				original: features.length,
				max: features.length,
				full: resp.results.length
			}
		};
	}

	return Parser;

});

