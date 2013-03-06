var geogoose = require('../'),
	mongoose = require('mongoose'),
	assert = require("assert");

describe('GeoFeature', function() {

	assert(process.env.DB_PATH, 'process.env.DB_PATH is not defined');

	before(function() {
		mongoose.connect(process.env.DB_PATH);
	});

	var GeoFeatureSchema = new geogoose.models.GeoFeatureSchema({createdAt: {type: Date, default: Date.now}}),
		GeoFeatureCollectionSchema = new geogoose.models.GeoFeatureCollectionSchema({}, {FeatureSchema: GeoFeatureSchema}),
		GeoFeatureCollection = mongoose.model('TestGeoFeatureCollection', GeoFeatureCollectionSchema),
		featureCollection = new GeoFeatureCollection({_id: new mongoose.Types.ObjectId()}),
		GeoFeature = featureCollection.getFeatureModel();

	it('should create three GeoFeatures', function(done) {
		var dequeueSave = function(coordinates) {
			if (!coordinates.length) {
				done();
			} else {
				new GeoFeature({
					type: "Point",
				    featureCollection: featureCollection,
				    geometry: {
				        type: "Point", 
				        coordinates: coordinates.shift()
				    }
				}).save(function(err) {
					if (err) throw err;
					dequeueSave(coordinates);
				});
			}
		};

		dequeueSave([
			[0, -359],
			[[100, 100], [0, 90]],
			[[100, 90], [101, 90], [99, -1]]
		]);
	});

	it('should find 3 features, and the coordinates should be correct', function(done) {
		featureCollection.findFeatures(function(err, collection, features) {
			assert.equal(features.length, 3);
			assert.deepEqual(features[0].bounds.map(function(a){return a;}), [[0, -359], [0, -359]]);
			assert.deepEqual(features[0].bounds2d.map(function(a){return a;}), [[0, 1], [0, 1]]);
			done();
		});
	});

	var found;
	it('should find a subset using a 2D index on bounds2d and sort them by createdAt', function(done) {
		var within = [[-1, -100], [100, 1.1]];
		GeoFeature.findWithin(within, {}, null, {sort: {'createdAt': -1}},
			function(err, result) {
				if (err) throw err;
				assert.equal(result.length, 2);
				found = result;
				done();
			});
	});

	it('should return the correct flat bbox for two-dimensional bounds when converted to GeoJSON', function() {
		assert.deepEqual(found[0].toGeoJSON().bbox, [99, -1, 101, 90]);
		assert.deepEqual(found[1].toGeoJSON().bbox, [0, -359, 0, -359]);
	});

	after(function() {
		mongoose.disconnect();
	});

});
