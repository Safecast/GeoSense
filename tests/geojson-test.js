var application_root = __dirname,
	config = require("./config.js"),
	path = require("path"),
	express = require("express"),
  	mongoose = require('mongoose'),
  	models = require('./models.js'),
  	utils = require('./utils.js'),
  	permissions = require('./permissions.js'),
  	ejs = require('ejs'),
    console = require('./ext-console'),
	assert = require("assert");

utils.connectDB(function() {

	models.GeoFeature.remove({}, function() {

		var dequeueCoordinates = function(coordinates) {
			if (!coordinates.length) {
				var within = [[-1, -1], [100, 1.1]];
				console.log('find features with bbox within', within);
				models.GeoFeature.find({
					bbox: {$within: {
						$box: within
					}}
				}, function(err, result) {
					assert.equal(result.length, 2);
					result.forEach(function(model) {
						console.log(model.toGeoJSON());
					});
					process.exit();
				});

				return;
			}

			var m = new models.GeoFeature({
				type: "Point",
			    featureCollection: new models.GeoFeatureCollection(),
			    geometry: {
			        type: "Point", coordinates: coordinates.shift()
			    }
			});
			console.log('saving', m.toGeoJSON());

			m.save(function(err, obj) {
				assert(!err);
				dequeueCoordinates(coordinates);
			});

		};

		dequeueCoordinates([
			[0, 1],
			[[100, 100], [0, 90]],
			[[100, 90], [10, 90], [99, -1]]

		]);
	});
	
});

