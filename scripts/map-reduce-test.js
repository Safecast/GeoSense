var ReductionKeys = {
	copy: function(value) {
		return value;
	},
	daily: function(t) {
		return t.getFullYear()+''+t.getMonth()+''+t.getDay()	
	},
	weekly: function(t) {
		var onejan = new Date(t.getFullYear(),0,1);
		var week = Math.ceil((((t - onejan) / 86400000) + onejan.getDay()+1)/7);
		return t.getFullYear() + '' + week;
	},
	yearly: function(t) {
		return t.getFullYear()	
	},
	LocGrid: function(grid_size) {
		return function(loc) {
			if (!loc || isNaN(parseFloat(loc[0])) || isNaN(parseFloat(loc[1]))) return;
			var lat = loc[0];
			var lng = loc[1];
			var grid_lat = Math.round((lat - lat % grid_size) / grid_size);
			var grid_lng = Math.round((lng - lng % grid_size) / grid_size);
			return [
				grid_lat + ',' + grid_lng + ',' + grid_size, 
				[grid_lat * grid_size, grid_lng * grid_size]
			];
		};
	}
};
var runGridReduce = function(collection, reduced_collection, value_fields, reduction_keys, options) {
	var map = function() {
		var keyValues = [];
		var e = {};
		for (var k in reduction_keys) {
			var keyValue = reduction_keys[k].call(reduction_keys[k], this[k]);
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
		print('KEY = '+key);
		for (var k in value_fields) {
			var value_field = value_fields[k];
			e[value_field] = {
				sum: this[value_field],
				count: 1
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
				count: 0
			};
		}
		values.forEach(function(doc) {
			for (var k in value_fields) {
				var value_field = value_fields[k];
				reduced[value_field].sum += doc[value_field].sum;
				reduced[value_field].count += doc[value_field].count;
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
	db[reduced_collection].drop();
	if (!value_fields) {
		value_fields = ['val'];
	}
	reduction_keys.loc = ReductionKeys.LocGrid(10);
	//var index = {};
	//index[loc_field] = '2d';
	//db[reduced_collection].ensureIndex(index);
	var params = {
		mapreduce: collection
		,map: map
		,reduce: reduce
		,finalize: finalize
		,out: {reduce: reduced_collection}
		,scope: {
			value_fields: value_fields,
			reduction_keys: reduction_keys
		}
		,verbose: true
		,keeptemp: true
	};
	print(params.reduce);
	if (options) {
		for (k in options) {
			params[k] = options[k];
		}
	} 
	return db.runCommand(params);
};

// Run on safecast for grid size 1 and without conditions
use geo;
var op = runGridReduce('points', 'r_points_10', ['val'], {collectionid: ReductionKeys.copy, loc: ReductionKeys.LocGrid(10), datetime: ReductionKeys.weekly}, { limit: 10000 });
db[op.result].count();

