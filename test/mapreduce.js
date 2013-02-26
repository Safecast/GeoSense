var	models = require('../models'),
	config = require('../config'),
	GeoFeatureCollection = models.GeoFeatureCollection,
	assert = require('assert'),
	mongoose = require('mongoose');

describe('MapReduce', function() {
	var featureCollection, GeoFeature;

	before(function(done) {
		mongoose.connect(config.DB_PATH);
		featureCollection = new GeoFeatureCollection({
			active: true, 
			status: config.DataStatus.COMPLETE, 
			title: 'MapReduce test'
		});
		featureCollection.save(function(err, collection) {
			GeoFeature = collection.getFeatureModel();
			return done(err);
		});
	});

	it('should create an array of points', function(done) {
		var increment = .03,
			features = [];

		for (var y = 0; y < 2; y += increment) {
			for (var x = 0; x < 2; x += increment) {
				features.push(new GeoFeature({
					featureCollection: featureCollection,
					geometry: {
						type: 'Point',
						coordinates: [x, y]
					},
					type: 'Point',
					properties: {
						someVal: x * y
					}
				}));
			}
		}

		var dequeueFeature = function() {
			if (!features.length) {
				done();
				return;
			}
			features.shift().save(function(err, point) {
				if (err) throw err;
				dequeueFeature();
			});
		};

		dequeueFeature();

	});


	after(function() {
		mongoose.disconnect();
	});

});



