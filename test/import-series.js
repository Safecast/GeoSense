var	models = require('../models'),
	api = new require('../api')(),
	GeoFeatureCollection = models.GeoFeatureCollection,
	config = require('../config'),
	errors = require('../errors'),
	assert = require('assert'),
	mongoose = require('mongoose');

describe('Series Import', function() {
	var featureCollection;

	before(function(done) {
		mongoose.connect(config.DB_URI);
		GeoFeatureCollection.remove(function(err) {
			return done(err);
		});
	});

	var importCollection,
		years = ['1950', '1955', '1960', '1965', '1970', '1975', '1980', '1985', '1990', '1995', '2000', '2005', '2010', '2015', '2020', '2025'],
		transform = [
			{
				'to': 'geometry.coordinates',
				'from': ['Latitude', 'Longitude'],
				'type': 'LatLng',
			},
			{
				'to': 'properties.Name',
				'from': 'Urban Agglomeration',
				'type': 'String',
			},
			{
				'to': 'properties.Country',
				'from': 'Country',
				'type': 'String',
			},
			{
				'to': 'properties.City Code',
				'from': 'City Code',
				'type': 'String',
			},
			{
				'to': 'properties.Population',
				'from': years,
				'type': 'Number',
				'series': [
					{
						'to': 'properties.Year',
						'from': '$series.from',
						'type': 'Date',
					},
				]
			},
		];

	it('should import a CSV file', function(done) {
		api.import.import({
			path: 'test/data/agglomerations.csv',
			transform: transform
		}, null, null, function(err, collection) {
			if (err) throw err;
			importCollection = collection;
			done();
		});
	});

	it('should find the correctly expanded series of the CSV file\'s Tokyo row', function(done) {
		importCollection.getFeatureModel()
			.find({'properties.Name': 'Tokyo'})
			.sort({'properties.Year': 1})
			.exec(function(err, features) {
				if (err) throw err;
				assert.equal(features.length, 16);
				features.forEach(function(feature, index) {
					assert.equal(feature.properties.Year.getUTCFullYear(), years[index]);
				});
				done();
			});
	});

	after(function() {
		mongoose.disconnect();
	});

});
