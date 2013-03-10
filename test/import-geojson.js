var	models = require('../models'),
	api = new require('../api')(),
	GeoFeatureCollection = models.GeoFeatureCollection,
	config = require('../config'),
	assert = require('assert'),
	mongoose = require('mongoose');

describe('GeoJSON', function() {
	var featureCollection;

	before(function(done) {
		mongoose.connect(config.DB_PATH);
		featureCollection = new GeoFeatureCollection({
			active: true, 
			status: config.DataStatus.COMPLETE, 
			title: 'GeoJSON test'
		});
		featureCollection.save(function(err, collection) {
			return done(err);
		});
	});

	var ImportedModel;

	it('should import a GeoJSON file and save each Feature in the DB, determining the collection\'s bbox', function(done) {

		api.import.import({
			path: 'test/data/internet_users_2005_choropleth_lowres.json',
			format: 'geojson'
		}, null, null, function(err, collection) {
			if (err) throw err;
			//console.log(collection);
			assert.deepEqual(collection.bbox.toObject(), [-180, -55.71, 179.96, 83.57 ]);
			assert.deepEqual(collection.bounds2d.toObject(), [[-180, -55.71], [179.96, 83.57]]);
			ImportedModel = collection.getFeatureModel();
			done();
		});

	});

	it('should find Switzerland by name', function(done) {

		ImportedModel.findOne({'properties.name': 'Switzerland'}, function(err, result) {
				if (err) throw err;
				assert(result);
				assert.deepEqual(result.toGeoJSON().bbox, [ 5.970000000000001,45.839999999999996, 10.47,47.71 ]);
				done();
		});

	});

	it('should find countries within a box', function(done) {

		ImportedModel.within([[1,40],[11,48]]).sort({'properties.name': 1}).exec(function(err, result) {
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



