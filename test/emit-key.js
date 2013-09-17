var	EmitKey = require('../api/aggregate/mapreduce_abstraction').EmitKey,
	assert = require('assert');

describe('MapReduce', function() {

	// TODO: add more tests, but based on GeoJSON geometry only

	/*it('should return the correct emit key and bounding box given [x,y]', function() {
		assert.deepEqual(new EmitKey.Tile.Rect(2.5, 2.5).get([1.0, 2.6]), ["2.5:0,1", [ [0,2.5],[2.5,5] ]]);
	});

	it('should return the correct emit key and bounding box given [x,y] and a non-square tile size', function() {
		assert.deepEqual(new EmitKey.Tile.Rect(2.5, .5).get([1.0, 2.6]), ["2.5*0.5:0,5", [ [0,2.5],[2.5,3] ]]);
	});

	it('should return the correct emit key and bounding box given a bounding box [[w,n],[e,s]]', function() {
		assert.deepEqual(new EmitKey.Tile.Rect(2.5, 2.5).get([ [7.5,2.7], [5.0,2.6] ]   ), ["2.5:2,1,3,1", [ [5,2.5],[10,5] ]]);
	});*/

	it('should return the correct emit key and polygon given GeoJSON Point geometry', function() {
		assert.deepEqual(new EmitKey.Tile.Rect(2.5, 2.5).get({
			type: 'Point',
			coordinates: [1.0, 2.6]
		}), ["0,1", {
			type: 'Point',
			coordinates: [1.25,3.75]
		}]);
	});

	it('should return the correct emit key and polygon given GeoJSON Polygon geometry', function() {
		assert.deepEqual(new EmitKey.Tile.Rect(2.5, 2.5).get({
			type: 'Polygon',
			coordinates: [[7.5,2.7], [5.0,2.6]]
		}), ["2,1,3,1", {
			type: 'Polygon',
			coordinates: [[ [5,2.5],[10,2.5],[10,5],[5,5],[5,2.5] ]]
		}]);
	});

});