var base = require('./base.js'),
	ConversionError = require('../conversion.js').ConversionError;

/**
* Converts a string like ' y.yyy ,  -xx.x' to [x, y]
*/	
this.locFromFields = function(lngFields, latFields) 
{
	baseLocFromFields = base.locFromFields(lngFields, latFields);
	return function() {
		var loc = baseLocFromFields.apply(this);
		if (loc instanceof Array && loc[0] == 0 && loc[1] == 0) {
			return new ConversionError('Ignoring point at [0,0]');
		}
		return loc;
	}
};

this.PointConverter = {
	fields: {
		val: function() {
			return parseFloat(this.get('Value')) * (this.get('Unit') == 'cpm' ? 1.0 : 350.0);
		}
		/*,altVal: function() {
			return [parseFloat(this.get('value'))] / (this.get('unit') == 'cpm' ? 350.0 : 1.0);
		}*/
		,datetime: function() {
			return new Date(this.get('Captured Time'));
		}
		,loc: this.locFromFields(['lng', 'Longitude'], ['lat', 'Latitude'])
		,sourceId: function() {
			return this.get('MD5Sum');
		}
		,incField: function() {
			return this.get('Captured Time');
		}
	}
};
