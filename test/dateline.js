var	models = require('../models'),
	GeoFeatureCollection = models.GeoFeatureCollection,
	config = require('../config'),
	format = require('../api/import/formats/json'),
	coordinates = require('../geogoose').coordinates,
	assert = require('assert'),
	mongoose = require('mongoose');

describe('Dateline', function() {
/*
	var featureCollection, GeoFeature;
	

	before(function(done) {
		mongoose.connect(config.DB_URI);
		featureCollection = new GeoFeatureCollection({
			active: true, 
			status: config.DataStatus.COMPLETE, 
			title: 'Dateline test'
		});
		featureCollection.save(function(err, collection) {
			GeoFeature = collection.getFeatureModel();
			return done(err);
		});
	});

	var crossBox = [[[185, 0],[185, 1],[175, 1],[175,0]]];
	var crossBox2 = [[[175, 0],[175, -1],[185, -1],[185,0]]];
	var crossBox3 = [[[190, -1],[190, -2],[585, -2],[585,-1]]];

	it('should not overflow the bounds at 180 by default', function() {
		assert.deepEqual(coordinates.getBounds(crossBox), [ [ 175, 0 ], [ 185, 1 ] ]);
		assert.deepEqual(coordinates.getBounds(crossBox2), [ [ 175, -1 ], [ 185, 0 ] ]);
		assert.deepEqual(coordinates.getBounds(crossBox, true), [ [ 175, 0 ], [ -175, 1 ] ]);
		assert.deepEqual(coordinates.getBounds(crossBox2, true), [ [ 175, -1 ], [ -175, 0 ] ]);
	});

	it('Insert a polygon that crosses the dateline', function(done) {

		var f = new GeoFeature({
			featureCollection: featureCollection,
			type: 'Feature',
			geometry: {
				type: 'Polygon',
				coordinates: crossBox
			}
		});

		f.save(function(err, result) {
			assert.deepEqual(f.bounds2d.map(function(a) { return a; }), coordinates.getBounds(crossBox, true));

			if (err) throw err;
			done();
		});

	});

	it('Insert a polygon that crosses the dateline in the other direction', function(done) {

		var f = new GeoFeature({
			featureCollection: featureCollection,
			type: 'Feature',
			geometry: {
				type: 'Polygon',
				coordinates: crossBox2
			}
		});

		f.save(function(err, result) {
			assert.deepEqual(f.bounds2d.map(function(a) { return a; }), [ [ 175, 0 ], [ -175, 1 ] ]);

			if (err) throw err;
			done();
		});

	});

	it('Insert a polygon that crosses the dateline and wraps around Europe', function(done) {

		var f = new GeoFeature({
			featureCollection: featureCollection,
			type: 'Feature',
			geometry: {
				type: 'Polygon',
				coordinates: crossBox3
			}
		});

		f.save(function(err, result) {
			assert.deepEqual(f.bounds2d.map(function(a) { return a; }), [ [ 175, 0 ], [ -175, 1 ] ]);

			if (err) throw err;
			done();
		});

	});

	after(function() {
		mongoose.disconnect();
	});*/

});



