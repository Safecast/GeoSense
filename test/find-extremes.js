utils = require('../utils'),
	assert = require('assert');

describe('findExtremes', function() {

	var ex1, ex2, ex3;

	it('should work with an array of numbers', function() {
		ex1 = utils.findExtremes([1, 2, 3]);
		assert.deepEqual(ex1, {sum: 6, min: 1, max: 3, count: 3});
	});

	it('should be able to map/reduce the result with a new array of numbers', function() {
		ex2 = utils.findExtremes([-1, 100], ex1);
		assert.deepEqual(ex2, {sum: 105, min: -1, max: 100, count: 5});
	});

	it('should work with a scalar', function() {
		ex3 = utils.findExtremes(-2, ex2);
		assert.deepEqual(ex3, {sum: 103, min: -2, max: 100, count: 6});
	});


});
