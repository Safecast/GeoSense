/**
* Map-reduces a collection with a 2d geospatial index on a `location` field,
* summing and counting the points within squares having a length of,
* `grid_size` in degrees of latitude and longitude.
*/
var runGridReduce = function(collection, grid_size, location_field, value_field, query) {
	var map = function() {
		if (!this[location_field]) return;
		var r = Math.floor;
		grid_size = Math.max(1, grid_size);
		var grid_lat = r(this[location_field][0] / grid_size);
		var grid_lng = r(this[location_field][1] / grid_size);
		var key = grid_lat + ',' + grid_lng;
		
		var e = {
			count: 1,
		};
		e[location_field] = [grid_lat * grid_size, grid_lng * grid_size];
		e[value_field] = this[value_field];

		emit(key, e);
	};

	var reduce = function(key, values) {
		var sum = 0;
		var count = 0;
		values.forEach(function(doc) {
			count += doc.count;
			sum += doc[value_field];
		});
		var r = {
			count: count
		};
		r[location_field] = [values[0][location_field][0], values[0][location_field][1]];
		r[value_field] = sum;
		return r;
	};

	var reduced_collection = collection + '_grid_' + grid_size;
	db[reduced_collection].drop();
	if (!location_field) {
		location_field = 'location';
	}
	if (!value_field) {
		value_field = 'value';
	}
	var index = {};
	index[location_field] = '2d';
	db[reduced_collection].ensureIndex(index);

	return db.runCommand({
		mapreduce: collection
		,query: query 
		,map: map
		,reduce: reduce
		,out: {reduce: reduced_collection}
		,scope: {
			grid_size: grid_size, 
			location_field: location_field,
			value_field: value_field
		}
		,verbose: true
		,keeptemp: true
	});
};

// Run on safecast for grid size 1 and without conditions
use geo;
var op = runGridReduce('safecast', 1, 'location', 'reading_value');

// Test 
var grp = db[op.result].group({
    initial: {count: 0, total_value: 0},
	reduce: function(doc, out){ var v = doc.value; out.count += v.count; print(out.count); out.total_value+=v.reading_value },
    finalize: function(out){ out.avg_value = out.total_value / out.count }
}, function(err, datasets) {
	print(datasets);
});
op;
grp;

