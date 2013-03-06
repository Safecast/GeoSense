var	models = require('../models'),
	api = new require('../api')(),
	GeoFeatureCollection = models.GeoFeatureCollection,
	config = require('../config'),
	assert = require('assert'),
	mongoose = require('mongoose');

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

	after(function() {
		mongoose.disconnect();
	});

});
