var	abstraction = require('../api/aggregate/mapreduce_abstraction'),
	Mapper = abstraction.Mapper,
	findExtremes = abstraction.scopeFunctions.findExtremes,
	assert = require('assert');

describe('Mappers', function() {

	// TODO: add more tests, but based on GeoJSON geometry only

	/*it('should return the correct emit key and bounding box given [x,y]', function() {
		assert.deepEqual(new Mapper.Tile.Rect(2.5, 2.5).map([1.0, 2.6]), ["2.5:0,1", [ [0,2.5],[2.5,5] ]]);
	});

	it('should return the correct emit key and bounding box given [x,y] and a non-square tile size', function() {
		assert.deepEqual(new Mapper.Tile.Rect(2.5, .5).map([1.0, 2.6]), ["2.5*0.5:0,5", [ [0,2.5],[2.5,3] ]]);
	});

	it('should return the correct emit key and bounding box given a bounding box [[w,n],[e,s]]', function() {
		assert.deepEqual(new Mapper.Tile.Rect(2.5, 2.5).map([ [7.5,2.7], [5.0,2.6] ]   ), ["2.5:2,1,3,1", [ [5,2.5],[10,5] ]]);
	});*/

	it('should return the correct emit key and polygon given GeoJSON Point geometry', function() {
		assert.deepEqual(new Mapper.Tile.Rect(2.5, 2.5).map({
			type: 'Point',
			coordinates: [1.0, 2.6]
		}), ["0,1", {
			type: 'Point',
			coordinates: [1.25,3.75]
		}]);
	});

	it('should return the correct emit key and polygon given GeoJSON Polygon geometry', function() {
		assert.deepEqual(new Mapper.Tile.Rect(2.5, 2.5).map({
			type: 'Polygon',
			coordinates: [[7.5,2.7], [5.0,2.6]]
		}), ["2,1,3,1", {
			type: 'Polygon',
			coordinates: [[ [5,2.5],[10,2.5],[10,5],[5,5],[5,2.5] ]]
		}]);
	});

	it('should create a histogram', function() {
		var histogram = new Mapper.Histogram(0, 100, 3),
			values = [0, 10, 30.329999, 33.34, 50, 75, 80, 85, 100],
			reduced;

		reduced = values.map(function(value) {
			var mapped = histogram.map(value);
			return {
				bin: mapped[0],
				count: 1,
				value: mapped[1]
			};
		}).reduce(function(previous, current) {
			if (!previous[current.bin]) {
				previous[current.bin] = {count: current.count};
			} else {
				previous[current.bin].count += current.count;
			}
			previous[current.bin].value = findExtremes(current.value, previous[current.bin].value);
			return previous;
		}, {});

		assert.equal(3, reduced[0].count);
		assert.equal(2, reduced[1].count);
		assert.equal(4, reduced[2].count);
	});

});


