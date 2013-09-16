var coordinates = require('../').coordinates,
	assert = require('assert');

describe('coordinates', function() {

	it('should work with nested coordinates to return a bounding box', function() {
		assert.deepEqual(coordinates.getBounds([ 
			[180.5, 10], 
			[[[170, 20]]], 
			[179.9, -1],
			[[182.5, 1], [200, -10]]
		]), [ [170, -10], [200, 20] ]);
	});

	it('should convert bounds to bbox and vice versa', function() {
		assert.deepEqual(coordinates.bboxFromBounds(
			[[1, 2], [3, 4]]), [1, 2, 3, 4]);
		assert.deepEqual(coordinates.boundsFromBbox(
			[1, 2, 3, 4]), [[1, 2], [3, 4]]);
	});

	it('should return one-dimensional array for points', function() {
		assert.deepEqual(coordinates.getBounds(
			[[[[11,12]]],[11,12]], true), [11, 12]);
	});

});

