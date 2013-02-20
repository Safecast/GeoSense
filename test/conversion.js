var conversion = require('../api/import/conversion'),
	assert = require('assert');

describe('conversion', function() {

	var PseudoModel = function(doc) {
		for (var k in doc) {
			this[k] = doc[k];
		}
		this.get = function(key) {
			return doc[key];
		}
	};

	var source = {
		'lat': 10,
		'lng': ' 11.0',
		'coordinates': ' 180,  185 ',
		'isodate': '1980-01-'
	};

	var Converter = new conversion.Converter({
		'xy': {
			'type': 'LatLng',
			'fromFields':  ['lat', 'lng']
		},
		'coordinates': {
			'type': 'LngLat',
			'fromFields': ['coordinates']
		}
	});

	var converted = Converter.convertModel(PseudoModel(source), PseudoModel);

	it('should convert [Lat,Lng] to [Lng,Lat]', function() {
		assert.deepEqual(converted.model.get('xy'), [11, 10]);
	});

	it('should convert "Lng,Lat" to [Lng,Lat] and clamp the numbers to -180 <= n < 180', function() {
		assert.deepEqual(converted.model.get('coordinates'), [-180, -175]);
	});

});
