var	models = require('../models'),
	config = require('../config'),
	api = new require('../api')(),
	coordinates = require('../geogoose/coordinates'),
	abstraction = require('../api/aggregate/mapreduce_abstraction'),
	Mapper = abstraction.Mapper,
	findExtremes = abstraction.util.findExtremes,
	GeoFeatureCollection = models.GeoFeatureCollection,
	assert = require('assert'),
	mongoose = require('mongoose');

describe('MapReduce', function() {

	var featureCollection, GeoFeature,
		generateCount = 1024,
		normalZoom = 1,
		increment = config.GRID_SIZES[normalZoom] / Math.sqrt(generateCount),
		days,
		attrMap = {
			numeric: 'properties.numVal',
			datetime: 'properties.date'
		};

	var rect = new Mapper.Tile.Rect(3,2);

	it('should return a Point for the center of the tile for original Point', function() {
		var emit = rect.map({
			type: 'Point',
			coordinates: [11,12]
		});
		assert.deepEqual(emit, ["3,6",{"type":"Point","coordinates":[10.5,13]}]);
	});

	it('should return a LineString from start to end for original LineString', function() {
		emit = rect.map({
			type: 'LineString',
			coordinates: [[15,16], [11,12]]
		});
		assert.deepEqual(emit, ["5,8,3,6",{"type":"LineString","coordinates":[[16.5,17],[10.5,13]]}]);
	});

	it('should return the reversed LineString original reversed LineString', function() {
		emit = rect.map({
			type: 'LineString',
			coordinates: [[11,12], [15,16]]
		});
		assert.deepEqual(emit, ["3,6,5,8",{"type":"LineString","coordinates":[[10.5,13],[16.5,17]]}]);
	});

	it('should return a Polygon for original closed LineString', function() {
		emit = rect.map({
			type: 'LineString',
			coordinates: [[11,12], [15,16], [11,12]]
		});
		assert.deepEqual(emit, ["3,6,5,8",{"type":"Polygon","coordinates":[[[9,12],[18,12],[18,18],[9,18],[9,12]]]}]);
	});

	it('should return a Polygon for original Polygon', function() {
		emit = rect.map({
			type: 'Polygon',
			coordinates: [[[11,12], [15,16]]]
		});
		assert.deepEqual(emit, ["3,6,5,8",{"type":"Polygon","coordinates":[[[9,12],[18,12],[18,18],[9,18],[9,12]]]}]);
	});

	it('should return the same Polygon for original reversed Polygon', function() {
		emit = rect.map({
			type: 'Polygon',
			coordinates: [[[15,16], [11,12]]]
		});
		assert.deepEqual(emit, ["3,6,5,8",{"type":"Polygon","coordinates":[[[9,12],[18,12],[18,18],[9,18],[9,12]]]}]);
	});

	before(function(done) {
		mongoose.connect(config.DB_URI);
		featureCollection = new GeoFeatureCollection({
			_id: new mongoose.Types.ObjectId(),
			active: true, 
			title: 'MapReduce test',
			tile: 'Rect',
			maxReduceZoom: 8,
			timebased: true
		});
		featureCollection.save(function(err, collection) {
			GeoFeature = collection.getFeatureModel();
			return done(err);
		});
	});

	it('should save an array of features', function(done) {
		var features = [];

		// TODO: this should be handled better -- keeping track of extremes manually is not very nice
		featureCollection.extremes.properties = {};
		for (var y = 0; y < config.GRID_SIZES[normalZoom]; y += increment) {
			days = 0;
			for (var x = 0; x < config.GRID_SIZES[normalZoom]; x += increment) {
				var feature = new GeoFeature({
					featureCollection: featureCollection,
					geometry: {
						type: 'Point',
						coordinates: [x, y]
					},
					type: 'Feature',
					properties: {
						numVal: x * y,
						x: x,
						y: y,
						strVal: '_' + x * y,
						otherVal: 'sameForAll',
						date: new Date(2013, 0, days + 1)
					}
				});
				days++;

				for (var key in feature.properties) {
					featureCollection.extremes.properties[key] = findExtremes(feature.properties[key], featureCollection.extremes.properties[key]);
				}

				features.push(feature);
			}
		}

		assert.equal(features.length, generateCount);

		var dequeueFeature = function() {
			if (!features.length) {
				assert.equal(generateCount, featureCollection.extremes.properties.numVal.count);
				featureCollection.getFeatureModel().count({}, function(err, count) {
					if (err) throw (err);
					assert.equal(count, generateCount);
					done();
				});
				return;
			}
			features.shift().save(function(err, feature) {
				if (err) throw err;
				dequeueFeature();
			});
		};

		dequeueFeature();
	});

	it('should run MapReduce to get a daily overall', function(done) {
		api.aggregate.aggregate({
			featureCollectionId: featureCollection._id.toString(),
			zoom: normalZoom,
			types: ['daily'],
			rebuild: true,
			attrMap: attrMap
		}, null, null, function(err) {
			if (err) throw err;

			featureCollection.getMapReducedFeatureModel({timeGrid: 'daily'})
				.find(function(err, features) {
					if (err) throw err;
					assert.equal(features.length, days);
					assert.equal(features[0].get('value').count, days);
					done();
				});

		});
	});

	it('should run MapReduce at the size of the area where features were generated, resulting in 1 single feature', function(done) {
		api.aggregate.aggregate({
			featureCollectionId: featureCollection._id.toString(),
			zoom: normalZoom,
			types: ['tile'],
			rebuild: true,
			attrMap: attrMap
		}, null, null, function(err) {
			if (err) throw err;

			featureCollection.getMapReducedFeatureModel({tileSize: config.GRID_SIZES[normalZoom]})
				.find(function(err, features) {
					if (err) throw err;
					assert.equal(features.length, 1);
					assert.equal(features[0].get('value').count, generateCount);
					done();
				});

		});
	});

	it('should run MapReduce for the next zoom level, which has a grid cell area 4 times smaller, resulting in 4 features', function(done) {
		api.aggregate.aggregate({
			featureCollectionId: featureCollection._id.toString(),
			zoom: normalZoom + 1,
			types: ['tile'],
			rebuild: true,
			attrMap: attrMap
		}, null, null, function(err) {
			if (err) throw err;

			featureCollection.getMapReducedFeatureModel({tileSize: config.GRID_SIZES[normalZoom + 1]})
				.find(function(err, features) {
					if (err) throw err;
					assert.equal(features.length, 4);
					assert.equal(features[0].get('value').count, generateCount / 4.0);
					//console.log(features[0].toGeoJSON());
					done();
				});
		});
	});

	it('should find features at the next zoom level within one quarter of its area, resulting in one feature', function(done) {
		featureCollection.getMapReducedFeatureModel({tileSize: config.GRID_SIZES[normalZoom + 1]})
			// $within $box is inclusive -- hence subtract very small number from northeast of box
			.geoWithin(coordinates.polygonFromBbox(
				[0, 0, config.GRID_SIZES[normalZoom] / 2 - .00000001, config.GRID_SIZES[normalZoom] / 2 - .00000001]
			))
			.exec(function(err, features) {
				if (err) throw err;
				assert.equal(features.length, 1);
				assert.equal(features[0].get('value').count, generateCount / 4.0);
				//console.log(features[0].toGeoJSON());
				done();
			});
	});	

	after(function() {
		mongoose.disconnect();
	});

});



