var	models = require('../models'),
	GeoFeature = models.GeoFeature,
	GeoFeatureCollection = models.GeoFeatureCollection,
	utils = require('../utils'),
	converter = require('../api/import/conversion/shp'),
	format = require('../api/import/formats/json'),
	assert = require('assert'),
	mongoose = require('mongoose');


describe('GeoJSON', function() {
	var featureCollection;

	before(function(done) {
		utils.connectDB(function() {
			GeoFeature.remove(function(err) {
				if (err) return done(err);
				featureCollection = new GeoFeatureCollection();
				featureCollection.save(function(err) {
					return done(err);
				});
			})
		}, function(err) {
			return done(err);
		});
	});

	it('should import a GeoJSON file and save each Feature in the DB', function(done) {

		var parser = format.Parser(),
			totalCount, saved = 0;

		var onData = function(data) {
			var f = new GeoFeature(data);
			f.featureCollection = featureCollection;
			f.save(function(err, result) {
				if (err) throw err;
				saved++;
			});
		};

		var onEnd = function(data) {
			assert.equal(saved, totalCount);
			done();
		};

		parser.on('data', onData)
			.on('end', onEnd)
			.on('root', function(root, count) {
				totalCount = count;
		  	});

		parser.fromPath('test/data/internet_users_2005_choropleth_lowres.json');

	});

	it('should find Switzerland by name', function(done) {

		GeoFeature.findOne({'properties.name': 'Switzerland'}, function(err, result) {
			if (err) throw err;
			assert.deepEqual(result.toGeoJSON().bbox, [ 5.970000000000001,45.839999999999996, 10.47,47.71 ]);
			done();
		});

	});

	it('should find countries within a box', function(done) {

		GeoFeature.findWithin([[1,40],[11,48]], null, null, {sort: {'properties.name': 1}}, function(err, result) {
			if (err) throw err;
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

	});

	after(function() {
		mongoose.disconnect();
	});

});



