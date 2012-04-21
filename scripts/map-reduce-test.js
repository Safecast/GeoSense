/**
* Map-reduces a collection with a 2d geospatial index on a `location` field,
* summing and counting the points within squares having a length of,
* `grid_size` in degrees of latitude and longitude.
*/
var runGridReduce = function(collection, grid_size, value_fields, loc_field, time_field, time_grid, options) {
	var timeKey = {
		d: function(t) {
			return t.getFullYear()+''+t.getMonth()+''+t.getDay()	
		},
		w: function(t) {
			var onejan = new Date(t.getFullYear(),0,1);
			var week = Math.ceil((((t - onejan) / 86400000) + onejan.getDay()+1)/7);
			return t.getFullYear() + '' + week;
		},
		y: function(t) {
			return t.getFullYear()	
		},
	};
	var locKey = function(loc, grid_size) {
		var lat = loc[0];
		var lng = loc[1];
		var grid_lat = Math.round((lat - lat % grid_size) / grid_size);
		var grid_lng = Math.round((lng - lng % grid_size) / grid_size);
		return [grid_lat, grid_lng];
	};
	var map = function() {
		if (!this[loc_field] || isNaN(parseFloat(this[loc_field][0])) || isNaN(parseFloat(this[loc_field][1]))) return;
		var grid_loc = loc_key(this[loc_field], grid_size);
		var key = '';
		var e = {};
		if (time_key) {
			var t = this[time_field];
			print(t);
			if (!(t instanceof Date)) {
				t = new ISODate(t);
			}
			print(t);
			var tk = time_key(t);
			key += tk + ',';
			e[time_field] = tk;
		}
		key += grid_loc[0] + ',' + grid_loc[1];
		print('key = '+key);
		e[loc_field] = [grid_loc[0] * grid_size, grid_loc[1] * grid_size];
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
		reduced[loc_field] = [values[0][loc_field][0], values[0][loc_field][1]];
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
	var reduced_collection = collection + '_grid_' + grid_size;
	db[reduced_collection].drop();
	if (!loc_field) {
		loc_field = 'loc';
	}
	if (!value_fields) {
		value_fields = ['val'];
	}
	var index = {};
	index[loc_field] = '2d';
	db[reduced_collection].ensureIndex(index);
	var params = {
		mapreduce: collection
		,map: map
		,reduce: reduce
		,finalize: finalize
		,out: {reduce: reduced_collection}
		,scope: {
			grid_size: grid_size, 
			loc_field: loc_field,
			value_fields: value_fields,
			loc_key: locKey,
			time_key: timeKey[time_grid],
			time_field: time_field
		}
		,verbose: true
		,keeptemp: true
	};
	if (options) {
		for (k in options) {
			params[k] = options[k];
		}
	} 
	return db.runCommand(params);
};

// Run on safecast for grid size 1 and without conditions
use geo;
var op = runGridReduce('points', 10, ['val'], 'loc', 'datetime', 'w', { limit: 10000 });
db[op.result].count()
