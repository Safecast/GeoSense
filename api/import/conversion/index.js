var errors = require('../../../errors'),
	ValidationError = errors.ValidationError,
	console = require('../../../ext-console.js'),
	util = require('util'),
	_ = require('cloneextend');

var ARRAY_SEPARATORS = /[,;]/;

var ConversionError = function(msg, errors) {
	ConversionError.super_.call(this, msg, this.constructor);
    this.errors = errors;
}
util.inherits(ConversionError, errors.BasicError)
ConversionError.prototype.name = 'ValidationError';
ConversionError.prototype.message = 'Conversion Error';

var ValueSkippedError = function(msg, errors) {
	ValueSkippedError.super_.call(this, msg, this.constructor);
}
util.inherits(ValueSkippedError, errors.BasicError)
ValueSkippedError.prototype.name = 'ValueSkippedError';
ValueSkippedError.prototype.message = 'Value Skipped';

function isErr(val) {
	return val instanceof Error;
}

function isEmpty(val) {
	return val == '' || val == undefined || val == null;
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
		deg = -180 + deg % 180;
	}
	if (deg == 180) {
		deg = -180;
	}

	return deg;
};

var Cast = {

	Number: function(value, options) {
		if (options.skipEmpty && isEmpty(value)) {
			return;
		}
		var num = Number(value);
		if (isNaN(num)) {
			return new ConversionError('Not a number');
		}
		if (!options.skipZero || num != 0) {
			return num;
		}
	},

	String: function(value, options) {
		if (value != undefined) {
			var str = '' + value;
			if (!options.skipEmpty || value != '') {
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
			if (util.isDate(date)) {
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
						return new ValueSkippedError('Skipping low number: ' + num);
					} else if (options.max != undefined && num > options.max) {
						return new ValueSkippedError('Skipping high number:' + num);
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
				if (Array.isArray(v) && l == 1) {
					return v;
				}
				if (typeof v == 'string' && l == 1) {
					if (v != undefined) {
						arr = Cast.Array(v.split(ARRAY_SEPARATORS));
						if (arr) {
							var al = arr.length;
							for (j = 0; j < al; j++) {
								var casted = !cast ? arr[j] : cast(arr[j], options);
								if (isErr(casted)) return casted;
								if (!options.skipEmpty || !isEmpty(casted)) {
									arr[j] = casted;
								}
							}
							return arr;
						}
					}
				} else {	
					var casted = !cast ? v : cast(v, options);
					if (isErr(casted)) return casted;
					if (!options.skipEmpty || !isEmpty(casted)) {
						arr.push(casted);
					}
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
				if (!date) {
					return new ConversionError('No date recognized');
				}
			} else {
				var numbers = [];
				for (var i = 0; i < l; i++) {
					numbers[i] = Cast.Number(this.get(fromFields[i]), options);
				}
				date = Cast.Date(numbers);
				if (!date) {
					return new ConversionError('No date recognized');
				}
			}
			if (date) {
				if (!options.skipFuture || date <= new Date()) {
					return date;			
				} else {
					console.log(date, date <= new Date());
					return new ValueSkippedError('Skipping future date: ' + date);
				}
			}
		};
	},

	String: function(fromFields, options) {
		var fromFields = Cast.Array(fromFields);
		var l = fromFields.length;
		var options = options || {};

		if (!options.format) {
			var arrayOptions = _.cloneextend(options, {
					'cast': 'String'
				}),
				toArray = FieldType.Array(fromFields, arrayOptions);
			return function() {
				var arr = toArray.call(this);
				if (arr) {
					var joined = arr.join(options.join || ', ');
					if (!options.skipEmpty || !isEmpty(joined)) {
						return joined;
					}
				}
			}
		} else {
			return function() {
				var strings = {};
				for (var i = 0; i < l; i++) {
					var str = Cast.String(this.get(fromFields[i]), options);
					if (str != undefined) {
						strings[fromFields[i]] = str;
					}
				}
				var formatted = options.format.format(strings); 
				if (!options.skipEmpty || !isEmpty(joined)) {
					return formatted;
				}
			};
		}
	},

	LngLat: function(fromFields, options) {
		var options = options || {};
		var arrayOptions = _.cloneextend(options, {
			cast: 'Number',
			skipZero: false
		});
		var toArray = FieldType.Array(fromFields, arrayOptions);
		return function() {
			var arr = toArray.call(this);
			if (isErr(arr)) return arr;
			if (arr) {
				if (arr.length != 2) {
					return new ConversionError('Needs 2D');
				}
				arr = [clamp180(arr[0]), clamp180(arr[1])];
				if (!options.skipZero || (arr[0] != 0 && arr[1] != 0)) {
					return arr;
				} else {
					return new ConversionError('Skipping 0,0');
				}
			}
		}
	},
	
	LatLng: function(fromFields, options) {
		var toLngLat = FieldType.LngLat(fromFields, options);
		return function() {
			var arr = toLngLat.call(this);
			if (arr) {
				if (isErr(arr)) return arr;
				return [arr[1], arr[0]];
			}
		}
	}, 

	Object: function(fromFields, options) {
		var fromFields = Cast.Array(fromFields);
		var l = fromFields.length;
		var options = options || {};
		return function() {
			var val = {};
			for (var i = 0; i < l; i++) {
				var obj = this.get(fromFields[i]);
				if (typeof obj == 'object') {
					val = _.cloneextend(val, obj);
				}
			}
			return val;
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
			'skipEmpty': <Boolean>, // for Number
			'igoreZero': <Boolean>, // for String
			'skipFuture': <Boolean>, // for Date
			'cast': '<field-type>' // for Array elements
		}
	},
	// ...
}
*/

var Converter = function(fieldDefs, options) {
	var fields = {};
	if (typeof fieldDefs != 'object') {
		fieldDefs = {};
	}

	for (var toField in fieldDefs) {
		var d = fieldDefs[toField];
		fields[toField] = FieldType[d.type](d.fromFields || toField, d.options);
	}

	this.fields = fields;
	this.fieldDefs = fieldDefs;
	this.options = _.cloneextend({
		strict: true
	}, options || {});
};

Converter.prototype.convertModel = function(fromModel, toModel, config) {
	var doc = {}
		errors = 0;
	for (var destField in this.fields) {
		var f = this.fields[destField];
		doc[destField] = f.apply(fromModel, [doc]);
		if (isErr(doc[destField])) {
			console.error(doc[destField].name + ' on field ' + destField + ':', doc[destField].message);
			errors++;
		}
	}

	var m = new toModel(doc);

	if (0&&config.DEBUG) {
		console.log('converted:', doc);
	}
	
	return {
		model: (!this.options.strict || !errors ? m : null),
		converted: doc
	};
};

module.exports = {
	Converter: Converter,
	ConversionError: ConversionError,
	basicPointFieldDefs: {
		loc: {
			type: 'LngLat',
			fromFields: 'loc'
		},
		val: {
			type: 'Number',
			fromFields: 'val'
		}
	},

	PointConverterFactory: function(fieldDefs, options) {
		var errors = {},
			valid = true
			options = options || {},
			validFieldDefs = {};

		if (typeof fieldDefs != 'object') return false;

		for (var toField in fieldDefs) {
			var d = _.clone(fieldDefs[toField]),
				t;			
			switch (toField) {
				default:
 					if (!d.type || !FieldType[d.type]) {
 						d.type = 'String';
 					}
 					break;
				case 'loc':
 					if (d.type != 'LatLng') {
						d.type = 'LngLat';
 					}
					break;
				case 'val':
					d.type = 'Number';
					break;
				case 'datetime':
					d.type = 'Date';
					break;
				case 'label':
					d.type = 'String';
					break;
			}

			if (d.fromFields && (typeof d.fromFields == 'string' || (Array.isArray(d.fromFields) && d.fromFields.length > 0))) {
				console.log('validated converter field definition:', toField, d);
				validFieldDefs[toField]= d;
			} else {
				console.error('invalid converter field definition', toField, d);
				valid = false;
				errors[toField] = {
					message: 'field ' + toField + ' has no Element fromFields'
				};
			}
		}

		if (!fieldDefs.loc && options.strict) {
			valid = false;
			errors[toField] = {
				message: 'Point X,Y is required'
			};
		}

		if (valid) {
			return new Converter(validFieldDefs, options);
		} else {
			return new ValidationError(null, errors);
		}
	}
}
