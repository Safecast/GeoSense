var	models = require('../models'),
	api = new require('../api')(),
	GeoFeatureCollection = models.GeoFeatureCollection,
	config = require('../config'),
	assert = require('assert'),
	mongoose = require('mongoose');

describe('KML', function() {
	var featureCollection, GeoFeature;

	before(function() {
		mongoose.connect(config.DB_URI);
	});

	it('should import a KML file and extract custom properties', function(done) {

		api.import.import({
			path: 'test/data/scenic_vista.kml',
		}, null, null, function(err, collection) {
			if (err) throw err;
			collection.getFeatureModel().findOne({'properties.TrailHeadName': 'Mount Everest'}, function(err, feature) {
				if (err) throw err;
				assert(feature);
				assert.equal(feature.geometry.type, 'Point');
				assert.strictEqual(feature.properties.name, "Difficult trail");
				assert.strictEqual(feature.properties.TrailLength, 347.45);
				assert.strictEqual(feature.properties.ElevationGain, 10000);
				done();
			});
		});

	});

	it('should import a KML file and save a LineString', function(done) {

		api.import.import({
			path: 'test/data/linestring.kml',
		}, null, null, function(err, collection) {
			if (err) throw err;
			collection.getFeatureModel().findOne(function(err, feature) {
				if (err) throw err;
				assert(feature);
				assert.equal(feature.geometry.type, 'LineString');
				assert.equal(feature.geometry.coordinates.length, 11);
				done();
			});
		});

	});

	it('should import a KML file and save a Polygon', function(done) {

		api.import.import({
			path: 'test/data/polygon.kml',
		}, null, null, function(err, collection) {
			if (err) throw err;
			collection.getFeatureModel().findOne(function(err, feature) {
				if (err) throw err;
				assert(feature);
				assert.equal(feature.geometry.type, 'Polygon');
				assert.equal(feature.geometry.coordinates[0].length, 6);
				assert.equal(feature.geometry.coordinates[1].length, 6);
				done();
			});
		});

	});

	after(function() {
		mongoose.disconnect();
	});

});
