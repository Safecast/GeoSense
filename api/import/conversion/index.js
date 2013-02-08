var utils = require('../../../utils.js'),
	console = require('../../../ext-console.js'),
	_ = require('cloneextend');

var ARRAY_SEPARATORS = /[,;]/;

var ConversionError = function(msg) {
	this.message = msg;
};

function isValidDate(d) {
  if ( Object.prototype.toString.call(d) !== "[object Date]" )
    return false;
  return !isNaN(d.getTime());
}

var clamp180 = this.clamp180 = function(deg) 
{
	if (deg < -360 || deg > 360) {
		deg = deg % 360;	
	} 
	if (deg < -180) {
		deg = 180 + deg % 180;
	}
	if (deg > 180) {
		deg = 180 - deg % 180;
	}
	if (deg == 180) {
		deg = -180;
	}

	return deg;
};

var Cast = {

	Number: function(value, options) {
		var num = Number(value);
		if (!isNaN(num) && (!options.ignoreZero || num != 0)) {
			return num;
		}
	},

	String: function(value, options) {
		if (value != undefined) {
			var str = '' + value;
			if (!options.ignoreEmpty || value != '') {
				return str;
			}
		}
	},

	Array: function(value, options) {
	    if (value != undefined) {
		    if (!Array.isArray(value)) {
		        return [value];
		    } else {
		        return value;
		    }
	    }
	},

	Date: function(value, options) {
		if ((Array.isArray(value) && value.length == 3) || typeof(value) == 'string') {
			date = new Date(value);
			if (isValidDate(date)) {
				return date;
			}
		}
	}
}

var FieldType = {

	Number: function(fromFields, options) {
		var fromFields = Cast.Array(fromFields);
		var l = fromFields.length;
		var options = options || {};
		return function() {
			for (var i = 0; i < l; i++) {
				var num = Cast.Number(this.get(fromFields[i]), options);
				if (num != undefined) {
					if (options.min != undefined && num < options.min) {
						return new ConversionError('Ignoring low number: ' + num);
					} else if (options.max != undefined && num > options.max) {
						return new ConversionError('Ignoring high number:' + num);
					} else {
						return num;
					}
				}
			}
		};
	},

	Array: function(fromFields, options) {
		var fromFields = Cast.Array(fromFields);
		var l = fromFields.length;
		var cast = options.cast ? Cast[options.cast] : null;
		var options = options || {};
		return function() {
			var arr = [];
			for (var i = 0; i < l; i++) {
				var v = this.get(fromFields[i]);
				if (typeof v == 'string' && l == 1) {
					if (v != undefined) {
						arr = Cast.Array(v.split(ARRAY_SEPARATORS));
						if (arr) {
							var al = arr.length;
							for (j = 0; j < al; j++) {
								arr[j] = cast(arr[j], options);
							}
							return arr;
						}
					}
				} else {				
					arr.push(!cast ? v : cast(v, options));
				}
			}
			return arr;
		};
	},

	Date: function(fromFields, options) {
		var fromFields = Cast.Array(fromFields);
		var l = fromFields.length;
		var options = options || {};
		return function() {
			var date;
			if (l == 1) {
				date = Cast.Date(this.get(fromFields[0]), options);
			} else {
				var numbers = [];
				for (var i = 0; i < l; i++) {
					numbers[i] = Cast.Number(this.get(fromFields[i]), options);
				}
				date = Cast.Date(numbers);
			}
			if (date) {
				if (!options.ignoreFuture || date <= new Date()) {
					return date;			
				} else {
					return new ConversionError('Ignoring future date: ' + date);
				}
			}
		};
	},

	String: function(fromFields, options) {
		var fromFields = Cast.Array(fromFields);
		var l = fromFields.length;
		var options = options || {};
		return function() {
			var strings = {};
			for (var i = 0; i < l; i++) {
				var str = Cast.String(this.get(fromFields[i]), options);
				if (str != undefined) {
					if (!options.format) {
						return str;
					} else if (options.ignoreEmpty && str == '') {
						return new ConversionError('Ignoring empty string');
					} else {
						strings[fromFields[i]] = str;
					}
				}
			}
			if (options.format) {
				return options.format.format(strings); 
			}
		};
	},

	LngLat: function(fromFields, options) {
		var options = options || {};
		var arrayOptions = _.cloneextend(options, {
			cast: 'Number',
			ignoreZero: false
		});
		var toArray = FieldType.Array(fromFields, arrayOptions);
		return function() {
			var arr = toArray.call(this);
			if (arr && arr.length == 2) {
				arr = [clamp180(arr[0]), clamp180(arr[1])];
				if (!options.ignoreZero || (arr[0] != 0 && arr[1] != 0)) {
					return arr;
				} else {
					console.warn('Ignoring LngLat [0,0]');
				}
			}
		}
	},
	
	LatLng: function(fromFields, options) {
		var toLngLat = FieldType.LngLat(fromFields, options);
		return function() {
			var arr = toLngLat.call(this);
			if (arr) {
				return [arr[1], arr[0]];
			}
		}
	}
}

/**
Initializes a converter object based on field definitions, which look like the
following:

fieldDefs = {
	'<to-field-name>': {
		'type': 'Number|String|Array|Date',
		'fromFields': '<from-field-name>'|['<field1>', '<field2>', '...'],
		'options': { // all are optional
			'min': <Number>, // for Number
			'max': <Number>, // for Number
			'ignoreEmpty': <Boolean>, // for Number
			'igoreZero': <Boolean>, // for String
			'ignoreFuture': <Boolean>, // for Date
			'cast': '<field-type>' // for Array elements
		}
	},
	// ...
}
*/

var Converter = function(fields) {
	this.fields = fields;
};

Converter.prototype.convertModel = function(fromModel, toModel) {
	var doc = {};
	for (var destField in this.fields) {
		var f = this.fields[destField];
		doc[destField] = f.apply(fromModel, [doc]);
		if (doc[destField] instanceof ConversionError) {
			console.error('ConversionError on field ' + destField + ':', doc[destField].message);
			return false;
		} 
	}
	var m = new toModel(doc);
	return m;
};

module.exports = {
	Converter: Converter,
	ConversionError: ConversionError,
	ConverterFactory: function(fieldDefs) {
		var fields = {}
		for (var toField in fieldDefs) {
			var d = fieldDefs[toField];
			fields[toField] = FieldType[d.type](d.fromFields, d.options);
		}
		return new Converter(fields);
	}
}
