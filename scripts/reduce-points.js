var opts = {};
for (var k in config.REDUCE_SETTINGS.DB_OPTIONS) {
	opts[k] = config.REDUCE_SETTINGS.DB_OPTIONS[k];
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
	if (deg == 180) {
		deg = -180;
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

			loc[0] = clamp180(loc[0]);
			loc[1] = clamp180(loc[1]);

			if (grid_size) {
				var grid_lng = Math.round((loc[0] - loc[0] % grid_size) / grid_size);
				var grid_lat = Math.round((loc[1] - loc[1] % grid_size) / grid_size);
				var loc = [grid_lng * grid_size + grid_size / 2, grid_lat * grid_size + grid_size / 2];
				loc[0] = clamp180(loc[0]);
				loc[1] = clamp180(loc[1]);
			} else {
				var grid_lng = loc[0];
				var grid_lat = loc[1];
			}

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
	},
	Histogram: function(min, max, steps) {
		this.step = (max - min) / steps;
		this.steps = steps;
		this.min = min - min % this.step;
		this.max = max - max % this.step;
		this.get = function(val) {
			var stepVal = val - val % this.step;
			return [
				stepVal, 
				{step: Math.round((stepVal - this.min) / this.step), val: stepVal}
			];
		};
		this.name = 'hist-'+steps;
	}
};

var runGridReduce = function(collection, reduced_collection, value_fields, reduction_keys, indexes, options) {
	var map = function() {
		var keyValues = [];
		var e = {count: 1};
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
			if (this[value_field] != null) {
				if (this[value_field] instanceof Array) {
					e[value_field] = [];
					for (var v = 0; v < this[value_field].length; v++) {
						e[value_field][v] = {
							min: this[value_field][v],
							max: this[value_field][v]
						};
						if (isNumber(this[value_field][v])) {
							e[value_field][v].sum = this[value_field][v];
						}
					}
				} else {
					e[value_field] = {
						min: this[value_field],
						max: this[value_field]
					};
					if (isNumber(this[value_field])) {
						e[value_field].sum = this[value_field];
					}
				}
			}
		}
		if (stats) {
			stats.running++;
		}
		emit(key, e);
	};
	var reduce = function(key, values) {
		var reduced = {count: 0};
		for (var k in reduction_keys) {
			reduced[k] = values[0][k];
		}
		for (var k in value_fields) {
			var value_field = value_fields[k];
			if (values[0][value_field] != null) {
				if (values[0][value_field] instanceof Array) {
					reduced[value_field] = [];
					for (var v = 0; v < values[0][value_field].length; v++) {
						reduced[value_field][v] = {
							min: null,
							max: null
						};
						if (values[0][value_field][v].sum != null) {
							reduced[value_field][v].sum = 0;
						}
					}
				} else {
					reduced[value_field] = {
						min: null,
						max: null
					};
					if (values[0][value_field].sum != null) {
						reduced[value_field].sum = 0;
					}
				}
			}
		}
		values.forEach(function(doc) {
			reduced.count += doc.count;
			for (var k in value_fields) {
				var value_field = value_fields[k];
				var r = reduced[value_field];
				if (r != null) {
					if (r instanceof Array) {
						for (var v = 0; v < r.length; v++) {
							if (doc[value_field][v].sum != null) {
								r[v].sum += doc[value_field][v].sum;
							}
							if (r[v].min == null || r[v].min > doc[value_field][v].min) r[v].min = doc[value_field][v].min;
							if (r[v].max == null || r[v].max < doc[value_field][v].max) r[v].max = doc[value_field][v].max;
						}
					} else {
						if (doc[value_field].sum != null) {
							r.sum += doc[value_field].sum;
						}
						if (r.min == null || r.min > doc[value_field].min) r.min = doc[value_field].min;
						if (r.max == null || r.max < doc[value_field].max) r.max = doc[value_field].max;
					}
				}
			}
		});

		if (stats && stats.done != stats.running) {
			stats.update(stats);
		}
		return reduced;
	};
	var finalize = function(key, value) {
		for (var k in value_fields) {
			var value_field = value_fields[k];
			if (value[value_field] != null) {
				if (value[value_field] instanceof Array) {
					for (var v = 0; v < value[value_field].length; v++) {
						if (value[value_field][v].sum != null) {
							value[value_field][v].avg = value[value_field][v].sum / value.count;
						}
					}
				} else {
					if (value[value_field].sum != null) {
						value[value_field].avg = value[value_field].sum / value.count;
					}
				}
			}
		}
		return value;
	};
	if (!value_fields) {
		value_fields = ['val'];
	}

	var scope = {
		value_fields: value_fields,
		reduction_keys: reduction_keys,
		lpad: lpad,
		getWeek: getWeek,
		clamp180: clamp180
	};
	if (options.scope) {
		for (var k in options.scope) {
			scope[k] = options.scope[k];
		}
	}

	var params = {
		mapreduce: collection
		,map: map
		,reduce: reduce
		,finalize: finalize
		,out: {reduce: reduced_collection}
		,scope: scope
		,verbose: true
		,keeptemp: true
	};
	if (options) {
		for (k in options) {
			if (k != 'scope') {
				params[k] = options[k];
			} 
		}
	}
	var info = [];
	for (var k in reduction_keys) {
		info.push(reduction_keys[k].name || k);
	}
	var totalCount = db[collection].count(params.query);
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

var reducePoints = function(collectionId, reduction_keys, opts, value_fields) {
	var collection = 'points';
	var info = ['r', collection];
	for (var k in reduction_keys) {
		if (reduction_keys[k].name) {
			info.push(reduction_keys[k].name);
		}
	}
	var reduced_collection = info.join('_');
	if (opts.query && opts.query.pointCollection) {
		print('* removing existing reduction for '+opts.query.pointCollection.toString());
		db[reduced_collection].remove({
			'value.pointCollection': opts.query.pointCollection
		});
	} else {
		print('* dropping '+reduced_collection);
		db[reduced_collection].drop();
	}
	if (!value_fields) {
		value_fields = ['val', 'altVal', 'datetime', 'label'];
	}
	if (!opts.scope) {
		opts.scope = {};
	}

	if (opts.stats) {
		opts.scope.stats = {
			collectionId: opts.stats.collectionId,
			total: opts.stats.total,
			done: 0,
			running: 0,
			update: function(stats) {
				if (stats.running / stats.total > .001) {
					stats.done += stats.running;
					db.pointcollections.update({_id: stats.collectionId}, {$inc: {progress: stats.running}});
					stats.running = 0;
				}
			}
		};
	} else {
		opts.scope.stats = false;
	}	

	return runGridReduce(collection, reduced_collection, value_fields, reduction_keys, {
		count: 1,
		'val.avg': 1,
		'val.min': 1,
		'val.max': 1,
		pointCollection: 1,
		datetime: 1
	}, opts);
};

var numHistograms = config.HISTOGRAM_SIZES.length;

var cur = db.pointcollections.find({
	status: config.DataStatus.UNREDUCED
});

print('*** number of collections to reduce: ' + cur.count() + ' ***');

cur.forEach(function(collection) {
	opts.query = {pointCollection: collection._id};
	var statsTotal = db.points.count(opts.query) * (config.NUM_ZOOM_LEVELS + numHistograms);
	opts.stats = {total: statsTotal, collectionId: collection._id};
	db.pointcollections.update({_id: collection._id}, {$set: {status: config.DataStatus.REDUCING, progress: 0, numBusy: statsTotal}});

	print('*** collection = '+collection.title+' ('+collection._id+') ***');

	for (var i = 0; i < config.HISTOGRAM_SIZES.length; i++) {
		print('*** reducing for histogram = '+config.HISTOGRAM_SIZES[i]+' ***');
		reducePoints(collection._id, {
			pointCollection: ReductionKey.copy, 
			val: new ReductionKey.Histogram(collection.minVal, collection.maxVal, config.HISTOGRAM_SIZES[i])
		}, opts, []);
	}

	if (!collection.reduce) {
		print('*** creating unreduced copy of original ***');
		reducePoints(collection._id, {
			pointCollection: ReductionKey.copy, 
			loc: new ReductionKey.LocGrid(0)
		}, opts);

	} else if (collection.reduce) {
		for (var g in config.GRID_SIZES) {

			var grid_size = config.GRID_SIZES[g];
			print('*** reducing original for grid = '+g+' ***');

			reducePoints(collection._id, {
				pointCollection: ReductionKey.copy, 
				loc: new ReductionKey.LocGrid(grid_size)
			}, opts);
			
			if (config.REDUCE_SETTINGS.TIME_BASED) {
				reducePoints({
					pointCollection: ReductionKey.copy, 
					loc: new ReductionKey.LocGrid(grid_size), 
					datetime: new ReductionKey.Weekly()
				}, opts);
				
				reducePoints({
					pointCollection: ReductionKey.copy, 
					loc: new ReductionKey.LocGrid(grid_size), 
					datetime: new ReductionKey.Yearly()
				}, opts);

				reducePoints({
					pointCollection: ReductionKey.copy, 
					loc: new ReductionKey.LocGrid(grid_size), 
					datetime: new ReductionKey.Daily()
				}, opts);
			}
		}
	}
	
	db.pointcollections.update({_id: collection._id}, {$set: {status: config.DataStatus.COMPLETE, numBusy: 0}});
});
