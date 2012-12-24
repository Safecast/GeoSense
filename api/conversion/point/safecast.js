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
			var val = parseFloat(this.get('Value')) * (this.get('Unit') == 'cpm' ? 1.0 : 350.0);
			// filter out corrupt values
			if (isNaN(val) || val < 0 || val > 50000) {
				return new ConversionError('Invalid Value ('+this.get('Value')+')'); 
			}
			return val;
		}
		,datetime: function() {
			var d = this.get('Captured Time');
			if (d == null || d == '') {
				return new ConversionError('Invalid Captured Time');
			}
			var date = new Date(d);
			if (date > new Date()) {
				return new ConversionError('Ignoring future date (' + date + ')');
			}
			return date;
		}
		,loc: this.locFromFields(['lng', 'Longitude'], ['lat', 'Latitude'])
		,sourceId: function() {
			return this.get('MD5Sum');
		}
		,incField: function() {
			return new Date(this.get('Uploaded Time'));
		}
	}
};
