var coordinates = require('../geogoose').coordinates,
	assert = require('assert');

describe('coordinates', function() {

	it('should overflow numbers so that -180 <= x < 180', function() {
		var m = 180;

		assert.equal(coordinates.overflow(0, m), 0);

		assert.equal(coordinates.overflow(179, m), 179);
		assert.equal(coordinates.overflow(180, m), -180);
		assert.equal(coordinates.overflow(181, m), -179);

		assert.equal(coordinates.overflow(-179, m), -179);
		assert.equal(coordinates.overflow(-180, m), -180);
		assert.equal(coordinates.overflow(-181, m), 179);

		assert.equal(coordinates.overflow(360, m), 0);
		assert.equal(coordinates.overflow(361, m), 1);
		assert.equal(coordinates.overflow(540, m), -180);

		assert.equal(coordinates.overflow(-360, m), 0);
		assert.equal(coordinates.overflow(-361, m), -1);
		assert.equal(coordinates.overflow(-541, m), 179);

	});

	it('should work with two scalars or an array to return an overflown 2d array', function() {
		assert.deepEqual(coordinates.coordinates2d([1000, 180]), [-80, -180]);
		assert.deepEqual(coordinates.coordinates2d(-181, 180), [179, -180]);
	});

	it('should work with nested coordinates to return an overflown bounding box', function() {
		assert.deepEqual(coordinates.getBounds([ 
			[180.5, 10], 
			[[[170, 20]]], 
			[179.9, -1],
			[[182.5, 1], [200, -10]]
		], true), [ [-179.5, -10], [179.9, 20] ]);
	});

});

