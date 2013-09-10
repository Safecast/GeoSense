var	models = require('../models'),
	api = new require('../api')(),
	GeoFeatureCollection = models.GeoFeatureCollection,
	config = require('../config'),
	errors = require('../errors'),
	assert = require('assert'),
	mongoose = require('mongoose');

describe('Safecast', function() {
	var featureCollection;

	before(function(done) {
		mongoose.connect(config.DB_URI);
		GeoFeatureCollection.remove(function(err) {
			return done(err);
		});
	});

	var importCollection,
		transform = require('./data/safecast_transform');

	it('should import the first Safecast CSV dump', function(done) {
		api.import.import({
			path: 'test/data/safecast-dump-1.csv',
			transform: transform
		}, null, null, function(err, collection) {
			if (err) throw err;
			importCollection = collection;
			done();
		});
	});


	it('should result in the collection extremes being consistent with the import file', function() {
		assert.equal(importCollection.extremes.properties.val.min, 31);
		assert.equal(importCollection.extremes.properties.val.max, 33);
	});

	it('should find an imported point and check internal consistency of its properties', function(done) {
		importCollection.getFeatureModel().findOne(function(err, feature) {
			if (err) throw err;
			var f = feature;
			assert.equal(f.geometry.type, 'Point');
			assert.equal(f.type, 'Feature');
			assert.equal(Number(f.source.Value), f.properties.val);
			assert.equal(Number(f.source.Longitude), f.geometry.coordinates[0]);
			assert.equal(Number(f.source.Latitude), f.geometry.coordinates[1]);
			done();
		});
	});

	it('should sync with the second Safecast CSV dump incrementally using the previous transform', function(done) {
		api.import.sync({
			append: importCollection._id.toString(),
			path: 'test/data/safecast-dump-2.csv',
			incremental: true,
			break: true
		}, null, null, function(err, collection) {
			if (err) throw err;
			done();
		});
	});

	it('should have skipped four records because of invalid values, and two others because their incrementor field was lower that that of already imported ones', function(done) {
		// make sure the GeoFeatureCollection was actually saved
		GeoFeatureCollection.findOne({_id: importCollection._id.toString()}, function(err, collection) {
			if (err) throw err;
			importCollection = collection;
			importCollection.getFeatureModel().find(function(err, features) {
				if (err) throw err;
				assert.equal(4, features.length);
				assert.equal(features.length, importCollection.extremes.properties.val.count);
				done();
			});
		});
	});

	it('should result in the collection extremes being consistent with the second import file', function() {
		assert.equal(importCollection.extremes.properties.val.min, 10);
		assert.equal(importCollection.extremes.properties.val.max, 10000);
	});

	it('should fail gracefully when trying to sync with a corrupted file', function(done) {
		api.import.sync({
			append: importCollection._id.toString(),
			path: 'test/data/safecast-dump-corrupt.csv',
			incremental: true,
			break: true
		}, null, null, function(err, collection) {
			if (err) throw err;
			assert.equal(4, importCollection.extremes.properties.val.count);
			done();
		});
	});

	it('should fail gracefully and return an error when trying to sync with a non-existent URL', function(done) {
		api.import.sync({
			append: importCollection._id.toString(),
			url: 'http://0.0.0.0/foo.csv',
		}, null, null, function(err, collection) {
			if (!err instanceof errors.HTTPError) throw err;
			assert.equal(4, importCollection.extremes.properties.val.count);
			done();
		});
	});

	it('should sync with the Safecast CSV dump on the web', function(done) {
		api.import.sync({
			append: importCollection._id.toString(),
			url: 'https://api.safecast.org/system/measurements.csv',
			max: 100, // so as not to exceed default 2000ms timeout
		}, null, null, function(err, collection) {
			if (err) throw err;
			importCollection = collection;
			done();
		});
	});

	after(function() {
		mongoose.disconnect();
	});

});
