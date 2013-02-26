var	models = require('../models'),
	api = new require('../api')(),
	GeoFeatureCollection = models.GeoFeatureCollection,
	config = require('../config'),
	assert = require('assert'),
	mongoose = require('mongoose'),
	_ = require('cloneextend');

describe('KML', function() {
	var featureCollection, GeoFeature;

	before(function(done) {
		mongoose.connect(config.DB_PATH);
		featureCollection = new GeoFeatureCollection({
			active: true, 
			status: config.DataStatus.COMPLETE, 
			title: 'KML test'
		});
		featureCollection.save(function(err, collection) {
			return done(err);
		});
	});

	var ImportedModel;

	it('should import a KML file and save each Feature in the DB', function(done) {

		api.import.import({
			path: 'test/data/gz_2010_us_outline_500k.kml',
		}, null, null, function(err, collection) {
			if (err) throw err;
			ImportedModel = collection.getFeatureModel();
			done();
		});

	});

/*
	it('should find Switzerland by name', function(done) {

		ImportedModel.findOne({'properties.name': 'Switzerland'}, function(err, result) {
				if (err) throw err;
				assert(result);
				assert.deepEqual(result.toGeoJSON().bbox, [ 5.970000000000001,45.839999999999996, 10.47,47.71 ]);
				done();
		});

	});

	it('should find countries within a box', function(done) {

		ImportedModel.findWithin([[1,40],[11,48]], null, null, {sort: {'properties.name': 1}}, function(err, result) {
			if (err) throw err;
			assert(result.length);
			var countries = result.map(function(val) { return val.properties.name; });
			assert.deepEqual(countries, [ 
				'Andorra',
				'Austria',
				'Germany',
				'Liechtenstein',
				'Monaco',
				'Spain',
				'Switzerland' 
			]);
			done();
		});

	});*/

	after(function() {
		mongoose.disconnect();
	});

});
