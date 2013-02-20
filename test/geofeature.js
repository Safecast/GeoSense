var application_root = __dirname,
	config = require("../config.js"),
	path = require("path"),
	express = require("express"),
  	mongoose = require('mongoose'),
  	models = require('../models.js'),
  	utils = require('../utils.js'),
  	permissions = require('../permissions.js'),
  	ejs = require('ejs'),
    console = require('../ext-console'),
	assert = require("assert");

describe('GeoFeature', function() {

	before(function(done) {
		utils.connectDB(function() {
		    GeoFeature.remove(function(err){
		    	if (err) return done(err);
		    	done();
		    });
		}, function(err) {
			return done(err);
		});

	})	

	it('should create three GeoFeatures', function(done) {
		var dequeueSave = function(coordinates) {
			if (!coordinates.length) {
				done();
			} else {
				new models.GeoFeature({
					type: "Point",
				    featureCollection: new models.GeoFeatureCollection(),
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
			[0, 1],
			[[100, 100], [0, 90]],
			[[100, 90], [101, 90], [99, -1]]
		]);
	});

	var found;
	it('should find a subset using a 2D index on bbox', function(done) {
		var within = [[-1, -1000], [100, 1.1]];
		models.GeoFeature.findWithin(within, {}, null, {sort: {'createdAt': -1}},
			function(err, result) {
				if (err) throw err;
				assert.equal(result.length, 2);
				found = result;
				done();
			});
	});

	it('should return the correct flat representation of bbox when converted to GeoJSON', function() {
		assert.deepEqual(found[0].toGeoJSON().bbox, [99, -1, 101, 90]);
		assert.deepEqual(found[1].toGeoJSON().bbox, [0, 1, 0, 1]);
	});

});
