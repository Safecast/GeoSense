var	models = require('../models'),
	GeoFeature = models.GeoFeature,
	GeoFeatureCollection = models.GeoFeatureCollection,
	config = require('../config'),
	utils = require('../utils'),
	converter = require('../api/import/conversion/shp'),
	format = require('../api/import/formats/json'),
	assert = require('assert'),
	mongoose = require('mongoose'),
	_ = require('cloneextend');

describe('GeoJSON', function() {
	var featureCollection;

	before(function(done) {
		mongoose.connect(config.DB_PATH);
		GeoFeature.remove(function(err) {
			if (err) {
				console.log('done');
				return done(err);
			}
			featureCollection = new GeoFeatureCollection({
				active: true, 
				status: config.DataStatus.COMPLETE, 
				title: 'GeoJSON test'
			});
			featureCollection.save(function(err) {
			console.log('done');
				return done(err);
			});
		});
	});

	it('should import a GeoJSON file and save each Feature in the DB', function(done) {

		var parser = format.Parser(),
			totalCount, saved = 0;

		var onData = function(data) {
			var f = new GeoFeature(data, false);
			f.featureCollection = featureCollection;
			f.set('properties.original', _.cloneextend(data));
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
			assert(result);
			assert.deepEqual(result.toGeoJSON().bbox, [ 5.970000000000001,45.839999999999996, 10.47,47.71 ]);
			done();
		});

	});

	it('should find countries within a box', function(done) {

		GeoFeature.findWithin([[1,40],[11,48]], null, null, {sort: {'properties.name': 1}}, function(err, result) {
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

	});

	after(function() {
		mongoose.disconnect();
	});

});



