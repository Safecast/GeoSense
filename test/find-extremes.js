utils = require('../utils'),
	assert = require('assert');

describe('findExtremes', function() {

	var ex1, ex2, ex3, ex4;
	var round = function(obj) {
		var obj2 = {};
		for (var i in obj) {
			obj2[i] = Math.round(obj[i]);
		}
		return obj2;
	}

	it('should work with a scalar', function() {
		var ex0 = utils.findExtremes(100);
		assert.deepEqual(round(ex0), {sum: 100, min: 100, max: 100, count: 1, diff: 0});
	});

	it('should work with an array of strings', function() {
		var ex0 = utils.findExtremes(['b', 'c', 'e']);
		assert.deepEqual(ex0, {min: 'b', max: 'e', count: 3});
	});

	it('should work with an array of numbers', function() {
		ex1 = utils.findExtremes([600, 170]);
		assert.deepEqual(round(ex1), {sum: 770, min: 170, max: 600, count:2, diff: 92450});
	});

	it('should be able to map/reduce the result with a new array of numbers', function() {
		ex2 = utils.findExtremes([300, 470], ex1);
		assert.deepEqual(round(ex1), {sum: 1540, min: 170, max: 600, count: 4, diff: 106900});
	});

	it('should work with another scalar', function() {
		ex3 = utils.findExtremes(430, ex2);
		assert.deepEqual(round(ex3), {sum: 1970, min: 170, max: 600, count: 5, diff: 108520});
	});

	it('should calculate variance and stddev', function() {
		ex4 = utils.setStats(ex2);
		assert.deepEqual(round(ex3), {sum: 1970, min: 170, max: 600, count: 5, diff: 108520, avg: 394, variance: 21704, stddev: 147});
	});

});
