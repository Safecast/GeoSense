var c2d = require('../../../coordinates2d'),
	coordinates2d = c2d.coordinates2d,
	getBounds = c2d.getBounds,
	findExtremes = require('../../../utils').findExtremes;

/*
The following code can both be executed by Node and MongoDB during the MapReduce
operation. The latter needs to be passed a scope object containing all the 
utility functions that are used by the code below as MongoDB Code objects. 
The module exports an object called scopeFunctions for this purpose. 
*/


/*
Returns an attribute of an object by path in dot notation.
Example:
	
	getAttr({hello: {world: 'Hello World!'}}, 'hello.world') // ==> 'Hello World!'

*/
var getAttr = function(obj, path) {
	var _get = function(obj, pathSegments) {
		if (!obj) return undefined;
		var el = obj[pathSegments.shift()];
		if (!pathSegments.length) return el;
		return _get(el, pathSegments);
	};
	return _get(obj, path.split('.'));
};

/*
Sets an attribute of an object by path in dot notation.
Example:
	
	setAttr(obj, 'some.path', 'value') // ==> {some: {path: 'value'}}

*/
var setAttr = function(obj, path, value) {
	var _set = function(obj, pathSegments) {
		if (pathSegments.length == 1) {
			obj[pathSegments[0]] = value;
			return;
		}
		var seg = pathSegments.shift();
		if (obj[seg] == undefined) {
			obj[seg] = {};
		}
		_set(obj[seg], pathSegments);
	};
	_set(obj, path.split('.'));
};

var dump = function(obj) {
	var _dump = function(obj, indent) {
		var str = '';
		for (var k in obj) {
			for (var i = 0; i < indent * 2; i++) {
				str += ' ';
			}
			var d = '';
			if (typeof obj[k] == 'function')  {
				d = k + ': [Function]\n';
			} else if (typeof obj[k] == 'object') {
				if (obj[k].isObjectId) {
					d = k + ': ' + obj[k].str + '\n';
				} else {
					d = k + ':\n' + _dump(obj[k], indent + 1);
				}
			} else {
				d = k + ': ' + obj[k] + '\n';
			}
			str += d;
		}
		return str;
	};
	return _dump(obj, 0);
};


/*
Iterates over the fields listed in fieldNames in obj, and calls the iterator 
for each field, passing it the field name and the original object.
Listed field names may end with a wildcard, for instance "foo.bar.*", 
in which case the iterator would be called for each individual element of bar.
*/
var iterFields = function(fieldNames, obj, iterator) {
	arrayMap.call(fieldNames, function(fieldName) {
		if (fieldName.substr(-2) == '.*') {
			var fieldName = fieldName.substr(0, fieldName.length - 2);
				el = getAttr(obj, fieldName);
			for (var key in el) {
				iterator(fieldName + '.' + key, obj);
			}
		} else {
			iterator(fieldName, obj);
		}
	});
};

/*
MongoDB does not have Array.isArray, hence this function.
*/
isArray = function (v) {
  return v && typeof v === 'object' && typeof v.length === 'number' && !(v.propertyIsEnumerable('length'));
}

/*
MongoDB does not have Array.map, hence this function.
*/
var arrayMap = function(iterator) {
	var arr = this,
		result = [];
	for (var i = 0; i < arr.length; i++) {
		result.push(iterator(arr[i]));
	}
	return result;
}

/*
MongoDB does not have Array.reduce, hence this function.
*/
var arrayReduce = function(iterator, initial) {
	var arr = this,
		current = initial;
	for (var i = 0; i < arr.length; i++) {
		current = iterator(current, arr[i], i);
	}
	return current;
}

var lpad = function(str, padString, length) {
	var s = new String(str);
    while (s.length < length) {
        s = padString + s;
    }
    return s;
};

// Returns the week number for this date.  dowOffset is the day of week the week.
// "starts" on for your locale - it can be from 0 to 6. If dowOffset is 1 (Monday),
// the week returned is the ISO 8601 week number.
// @param int dowOffset
// @return int
var getWeek = function(date, dowOffset) {
	dowOffset = typeof(dowOffset) == 'int' ? dowOffset : 0; //default dowOffset to zero
	var newYear = new Date(date.getFullYear(),0,1);
	var day = newYear.getDay() - dowOffset; //the day of week the year begins on
	day = (day >= 0 ? day : day + 7);
	var daynum = Math.floor((date.getTime() - newYear.getTime() - 
		(date.getTimezoneOffset()-newYear.getTimezoneOffset()) * 60000) / 86400000) + 1;
	var weeknum;
	//if the year starts before the middle of a week
	if(day < 4) {
		weeknum = Math.floor((daynum+day-1)/7) + 1;
		if(weeknum > 52) {
			nYear = new Date(date.getFullYear() + 1,0,1);
			nday = nYear.getDay() - dowOffset;
			nday = nday >= 0 ? nday : nday + 7;
			/*if the next year starts before the middle of
 			  the week, it is week #1 of that year*/
			weeknum = nday < 4 ? 1 : 53;
		}
	}
	else {
		weeknum = Math.floor((daynum+day-1)/7);
	}
	return weeknum;
};

var EmitKey = 
{

	Copy: function() 
	{
		this.get = function(value) {
			return value;
		};
		return this;
	},

	Time: {

		Daily: function(t) 
		{
			this.get = function(t) {
				return [
					t.getFullYear()+''+lpad(t.getMonth(), '0', 2)+''+lpad(t.getUTCDate(), '0', 2),
					new Date(t.getFullYear(), t.getMonth(), t.getUTCDate())
				];	
			};
			this.name = 'daily';
			this.index = function(collection, field_name) {
				var index = {};
				index[field_name] = 1;
				collection.ensureIndex(index, function() {});
				//return (utils.collectionHasIndex(collection, index));
				return true;
			};
			return this;
		},

		Weekly: function(t) 
		{
			this.get = function(t) {
				var week = getWeek(t, 1);
				var day = t.getDay(),
			      diff = t.getDate() - day + (day == 0 ? -6 : 1);
				t.setDate(diff);
				return [
					t.getFullYear() + '' + lpad(week, '0', 2),
					new Date(t.getFullYear(), t.getMonth(), t.getUTCDate())
				];
			};
			this.name = 'weekly';
			this.index = function(collection, field_name) {
				var index = {};
				index[field_name] = 1;
				collection.ensureIndex(index, function() {});
				//return (utils.collectionHasIndex(collection, index));
				return true;
			};
			return this;
		},

		Yearly: function(t) 
		{
			this.get = function(t) {
				return [
					t.getFullYear(),
					new Date(t.getFullYear(), 0, 1)
				];
			};
			this.name = 'yearly';
			this.index = function(collection, field_name) {
				var index = {};
				index[field_name] = 1;
				collection.ensureIndex(index, function() {});
				//return (utils.collectionHasIndex(collection, index));
				return true;
			};
			return this;
		}
		
	},

	Tile: {

		Rect: function(gridW, gridH, options) 
		{
			var opts = options || {index: true};
			this.gridW = gridW;
			this.gridH = gridH;
			var name = gridW != gridH ? 
				(gridW != undefined ? gridW : 'x') + '*' + (gridH != undefined ? gridH : 'y') 
				: (gridW != undefined ? gridW + '' : '')
			this.prefix = name + ':';

			this.get = function(geometry) {
				if (!geometry) return;

				var _getTile = function(coordinates) {
					if (coordinates.length < 2 || isNaN(coordinates[0]) || isNaN(coordinates[1])) return;
					var gW = this.gridW,
						gH = this.gridH,
						c = coordinates2d(coordinates),
						w = c[0], e = w,
						s = c[1], n = s,
						gX = w, 
						gY = s;

					if (gW != undefined) {
						// west of tile
						gX = Math.round((w - w % gW) / gW); 
						w = gX * gW; 
						// east of tile
						e = w + gW;
					}
					if (gH != undefined) {
						// south of tile
						gY = Math.round((s - s % gH) / gH); 
						s = gY * gH; 
						// north of tile
						n = s + gH;
					}

					return [
						gX + ',' + gY,
						//coordinates2d(x, y)
						[[w, s], [e, n]]
					];
				};

				if (geometry.coordinates) {
					// geometry is GeoJSON 
					var bounds = getBounds(geometry.coordinates),
						l = _getTile.call(this, bounds[0]),
						h = _getTile.call(this, bounds[1]),
						w = l[1][0][0], s = l[1][0][1], e = h[1][1][0], n = h[1][1][1];
					return [this.prefix + l[0] + ',' + h[0], { 
						type: 'Polygon', 
						coordinates: [[ [w,s], [e,s], [e,n], [w,n] ]]
					}];
				} else if (isArray(geometry[0]) && isArray(geometry[1])) {
					// geometry is a bbox [[w,s],[e,n]]
					var bounds = getBounds(geometry),
						l = _getTile.call(this, bounds[0]),
						h = _getTile.call(this, bounds[1]);
					return [this.prefix + l[0] + ',' + h[0], [l[1][0], h[1][1]]];
				} else {
					// geometry is [x,y] 
					var t = _getTile.call(this, geometry);
					return [this.prefix + t[0], t[1]];
				}
			};

			this.name = 'tile_rect_' + name;

			if (opts.index) {
				this.index = function(collection, field_name) {
					var index = {};
					index[field_name] = '2d';
					collection.ensureIndex(index, function() {});
					//return (utils.collectionHasIndex(collection, index));
					return true;
				};
			}

			return this;
		}
	},

	Histogram: function(min, max, steps) 
	{
		this.step = (max - min) / steps;
		this.steps = steps;
		this.min = min - min % this.step;
		this.max = max - max % this.step;
		this.get = function(val) {
			var stepVal = val - val % this.step;
			return [
				stepVal, 
				{x: Math.round((stepVal - this.min) / this.step)}
			];
		};
		this.name = 'histogram_'+steps;
	}

};

module.exports = {
	EmitKey: EmitKey,
	// the functions that need to be in the scope of the EmitKey get() methods,
	// apart from the EmitKey object itself, this.
	scopeFunctions: {
		lpad: lpad,
		overflow: c2d.overflow,
		coordinates2d: c2d.coordinates2d,
		getBounds: c2d.getBounds,
		getWeek: getWeek,
		getAttr: getAttr,
		setAttr: setAttr,
		isArray: isArray,
		findExtremes: findExtremes,
		arrayMap: arrayMap,
		arrayReduce: arrayReduce,
		iterFields: iterFields,
		dump: dump
	},
	KEY_SEPARATOR: '|'
};