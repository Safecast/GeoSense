var	models = require('../models'),
	GeoFeatureCollection = models.GeoFeatureCollection,
	config = require('../config'),
	format = require('../api/import/formats/json'),
	assert = require('assert'),
	mongoose = require('mongoose'),
	_ = require('cloneextend');

describe('GeoJSON raw', function() {
	var featureCollection, GeoFeature;

	before(function(done) {
		mongoose.connect(config.DB_PATH);
		featureCollection = new GeoFeatureCollection({
			active: true, 
			status: config.DataStatus.COMPLETE, 
			title: 'GeoJSON test'
		});
		featureCollection.save(function(err, collection) {
			GeoFeature = collection.getFeatureModel();
			return done(err);
		});
	});

	it('should import a GeoJSON file and save each Feature in the DB', function(done) {

		var parser = format.Parser(),
			totalCount, saved = 0;

		var onData = function(data) {
			var f = new GeoFeature(data, false);
			f.featureCollection = featureCollection;
			f.set('properties.original', _.clone(data));
			f.save(function(err, result) {
				if (err) throw err;
				saved++;
				if (saved == totalCount) {
					done();
				}
			});
		};

		var onEnd = function(data) {
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

		GeoFeature.within([[1,40],[11,48]]).sort({'properties.name': 1}).exec(function(err, result) {
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



