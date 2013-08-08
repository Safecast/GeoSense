var transform = require('../api/import/data_transform'),
	assert = require('assert');

describe('DataTransform', function() {

	var PseudoModel = function(doc) {
		for (var k in doc) {
			this[k] = doc[k];
		}
		this.get = function(key) {
			return doc[key];
		}
		this.set = function(key, value) {
			doc[key] = value;
		}
	};

	var source = {
		'lat': 10,
		'lng': ' 11.0',
		'coordinates': ' 180,  185 ',
		'isodate': '1980-01-'
	};

	var dataTransform = new transform.DataTransform([
		{
			'to': 'xy',
			'type': 'LatLng',
			'from':  ['lat', 'lng']
		},
		{
			'to': 'coordinates',
			'type': 'LngLat',
			'from': ['coordinates']
		},
		{
			'to': 'numbers',
			'from': ['lat', 'lng'],
			'type': 'Object',
			'options': {
				'cast': 'Number'
			}
		},
		{
			'to': 'array1',
			'from': 'coordinates',
			'type': 'Array',
			'options': {
				'cast': 'Number',
				'split': true
			}
		},
		{
			'to': 'array2',
			'from': 'coordinates',
			'type': 'Array',
		}
	]);

	dataTransform.on('data', function(model, transformed) {
		it('should convert [Lat,Lng] to [Lng,Lat]', function() {
			assert.deepEqual(model.get('xy'), [11, 10]);
		});

		it('should convert "Lng,Lat" to [Lng,Lat] and clamp the numbers to -180 <= n < 180', function() {
			assert.deepEqual(model.get('coordinates'), [-180, -175]);
		});

		it('should cast numeric fields to numbers and return an object', function() {
			assert.deepEqual(model.get('numbers'), {lat: 10, lng: 11});
		});

		it('should return an array of numbers extracted from a comma-separated string', function() {
			assert.deepEqual(model.get('array1'), [180, 185]);
		});

		it('should return an array of all items', function() {
			assert.deepEqual(model.get('array2'), [source.coordinates]);
		});

		it('should correctly apply filters', function() {
			var arr = [1, 2, 3, 0, 4, 5, 0, 6];
			assert.deepEqual(
				transform.filterValue(arr, ['notZero', 'isEven', 'lte,4']),
				[2, 4]
			);
			assert.equal(
				transform.filterValue(1, ['isEven']),
				undefined
			);
		});
	});

	dataTransform.transform(PseudoModel(source), PseudoModel);

});
