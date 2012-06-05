var DEG_PER_PX_AT_ZOOM_0 = 0.7111111112100985

var GRID_SIZES = {
//	'-1': 2,
	'0': DEG_PER_PX_AT_ZOOM_0 * 4
};

for (var zoom = 1; zoom <= 15; zoom++) {
	GRID_SIZES[zoom] = GRID_SIZES[zoom - 1] / 2;
}

var opts = {
	limit: null
};


var lpad = function(str, padString, length) {
	var str = new String(str);
    while (str.length < length)
        str = padString + str;
    return str;
}

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
	(date.getTimezoneOffset()-newYear.getTimezoneOffset())*60000)/86400000) + 1;
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

var clamp180 = function(deg) {
	if (deg < -360 || deg > 360) {
		deg = deg % 360;	
	} 
	if (deg < -180) {
		deg = 180 + deg % 180;
	}
	if (deg > 180) {
		deg = 180 - deg % 180;
	}

	return deg;
};

var ReductionKey = {
	copy: function(value) {
		return value;
	},
	Daily: function(t) {
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
			collection.ensureIndex(index);
			return (collectionHasIndex(collection, index));
		}
		return this;
	},
	Weekly: function(t) {
		this.get = function(t) {
			var week = getWeek(t, 1);
			var day = t.getDay(),
		      diff = t.getDate() - day + (day == 0 ? -6 : 1);
			return [
				t.getFullYear() + '' + lpad(week, '0', 2),
				new Date(t.setDate(diff))
			];
		};
		this.name = 'weekly';
		this.index = function(collection, field_name) {
			var index = {};
			index[field_name] = 1;
			collection.ensureIndex(index);
			return (collectionHasIndex(collection, index));
		}
		return this;
	},
	Yearly: function(t) {
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
			collection.ensureIndex(index);
			return (collectionHasIndex(collection, index));
		}
		return this;
	},
	LocGrid: function(grid_size) {
		this.grid_size = grid_size;
		this.get = function(loc) {
			var grid_size = this.grid_size;
			if (!loc || isNaN(parseFloat(loc[0])) || isNaN(parseFloat(loc[1]))) return;

			/*if (loc[0] < -180 || loc[0] > 180 || loc[1] < -180 || loc[1] > 180) {
				print('warning: dropping point because loc not within +- 180');
				print(loc);
				return;
			}*/
			loc[0] = clamp180(loc[0]);
			loc[1] = clamp180(loc[1]);
			
			var lng = loc[0];
			var lat = loc[1];
			// Mongo manual: The index space bounds are inclusive of the lower bound and exclusive of the upper bound.
			if (lng == 180) {
				lng = -180;
			}
			if (lat == 180) {
				lat = -180;
			}
			var grid_lng = Math.round((lng - lng % grid_size) / grid_size);
			var grid_lat = Math.round((lat - lat % grid_size) / grid_size);
			var loc = [grid_lng * grid_size + grid_size / 2, grid_lat * grid_size + grid_size / 2];

			/*if (loc[0] < -180 || loc[0] > 180 || loc[1] < -180 || loc[1] > 180) {
				print('warning: dropping point because grid loc not within +- 180');
				print(loc);
				return;
			}*/
			loc[0] = clamp180(loc[0]);
			loc[1] = clamp180(loc[1]);

			return [
				grid_lng + ',' + grid_lat + ',' + grid_size, 
				loc
			];
		};
		this.name = 'loc-'+this.grid_size;
		this.index = function(collection, field_name) {
			var index = {};
			index[field_name] = '2d';
			collection.ensureIndex(index);
			return (collectionHasIndex(collection, index));
		}
		return this;
	}
};
var runGridReduce = function(collection, reduced_collection, value_fields, reduction_keys, indexes, options) {
	var map = function() {
		var keyValues = [];
		var e = {};
		for (var k in reduction_keys) {
			var f = reduction_keys[k].get || reduction_keys[k];
			var keyValue = f.call(reduction_keys[k], this[k]);
			if (!keyValue) return;
			if (keyValue instanceof Array) {
				keyValues.push(keyValue[0]);
				e[k] = keyValue[1];
			} else {
				keyValues.push(keyValue);
				e[k] = keyValue;
			}
		}
		var key = keyValues.join('|');
		for (var k in value_fields) {
			var value_field = value_fields[k];
			e[value_field] = {
				sum: this[value_field],
				count: 1,
				min: this[value_field],
				max: this[value_field]
			};
		}
		emit(key, e);
	};
	var reduce = function(key, values) {
		var reduced = {};
		for (var k in reduction_keys) {
			reduced[k] = values[0][k];
		}
		for (var k in value_fields) {
			var value_field = value_fields[k];
			reduced[value_field] = {
				sum: 0,
				count: 0,
				min: null,
				max: null
			};
		}
		values.forEach(function(doc) {
			for (var k in value_fields) {
				var value_field = value_fields[k];
				var r = reduced[value_field];
				r.sum += doc[value_field].sum;
				r.count += doc[value_field].count;
				if (r.min == null || r.min > doc[value_field].min) r.min = doc[value_field].min;
				if (r.max == null || r.max < doc[value_field].max) r.max = doc[value_field].max;
			}
		});
		return reduced;
	};
	var finalize = function(key, value) {
		for (var k in value_fields) {
			var value_field = value_fields[k];
			value[value_field].avg = value[value_field].sum / value[value_field].count;
		}
		return value;
	};
	if (!value_fields) {
		value_fields = ['val'];
	}
	var params = {
		mapreduce: collection
		,map: map
		,reduce: reduce
		,finalize: finalize
		,out: {reduce: reduced_collection}
		,scope: {
			value_fields: value_fields,
			reduction_keys: reduction_keys,
			lpad: lpad,
			getWeek: getWeek,
			clamp180: clamp180
		}
		,verbose: true
		,keeptemp: true
	};
	if (options) {
		for (k in options) {
			params[k] = options[k];
		}
	}

	var info = [];
	for (var k in reduction_keys) {
		info.push(reduction_keys[k].name || k);
	}
	print('* reducing '+collection+' to '+reduced_collection+' with key: '+info.join(' | ')+' ...');
	var op = db.runCommand(params);
	if (op.ok) {
		for (var k in reduction_keys) {
			if (reduction_keys[k].index) {
				var field_name = 'value.' + k;
				print('* building index for '+field_name+' ...');
				if (!reduction_keys[k].index.call(reduction_keys[k], 
						db[reduced_collection], field_name)) {
					print('ERROR: could not build index');
					return false;
				}
			}
		}
		if (indexes) {
			for (var k in indexes) {
				var field_name = 'value.' + k;
				print('* building index for '+field_name+' ...');
				var index = {};
				index[field_name] = indexes[k];
				db[reduced_collection].ensureIndex(index);
				if (!collectionHasIndex(db[reduced_collection], index)) {
					print('ERROR: could not build index');
					return false;
				}
			}
		}
		print('SUCCESS: reduced '+op.counts.input+' records to '+op.counts.output);
		return true;
	} else {
		print('ERROR: '+op.assertion);
		return false;		
	}
};

var collectionHasIndex = function(collection, key) {
	var indexes = collection.getIndexes();
	for (var i = 0; i < indexes.length; i++) {
		for (var j in key) {
			if (indexes[i].key[j] && indexes[i].key[j] == key[j]) {
				return true;
			}
		}
	}
	return false;
};

var reducePoints = function(reduction_keys, opts) {
	var collection = 'points';
	var info = ['r', collection];
	for (var k in reduction_keys) {
		if (reduction_keys[k].name) {
			info.push(reduction_keys[k].name);
		}
	}
	var reduced_collection = info.join('_');
	if (opts.query && opts.query.collectionid) {
		print('* removing existing points for '+opts.query.collectionid);
		db[reduced_collection].remove({
			'value.collectionid': opts.query.collectionid
		});
	} else {
		print('* dropping '+reduced_collection);
		db[reduced_collection].drop();
	}
	return runGridReduce(collection, reduced_collection, ['val'], reduction_keys, {
		count: 1,
		avg: 1,
		min: 1,
		max: 1,
		collectionid: 1
	}, opts);
};


var cur = db.pointcollections.find({});
cur.forEach(function(collection) {
	if (collection.reduce) {
		print('*** collection = '+collection.title+' ('+collection._id+') ***');
		opts.query = {collectionid: collection._id.toString()};
		for (var g in GRID_SIZES) {
			var grid_size = GRID_SIZES[g];
			print('*** grid = '+g+' ***');
			reducePoints({
				collectionid: ReductionKey.copy, 
				loc: new ReductionKey.LocGrid(grid_size)
			}, opts);
			
			/*reducePoints({
				collectionid: ReductionKey.copy, 
				loc: new ReductionKey.LocGrid(grid_size), 
				datetime: new ReductionKey.Weekly()
			}, opts);
	*/
			/*
			reducePoints({
				collectionid: ReductionKey.copy, 
				loc: new ReductionKey.LocGrid(grid_size), 
				datetime: new ReductionKey.Yearly()
			}, opts);

			/*reducePoints({
				collectionid: ReductionKey.copy, 
				loc: new ReductionKey.LocGrid(grid_size), 
				datetime: new ReductionKey.Daily()
			});*/
		}
	}
});
