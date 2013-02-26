var	Code = require('mongodb').Code,
	mongoose = require('mongoose'),
	MapReduceKey = require('./key.js').MapReduceKey,
	scopeFunctions = require('./key.js').scopeFunctions,
	console = require('../../../ext-console.js');

var runMapReduce = function(collection, reduced_collection, valueFields, mapReduceKeys, indexes, options, callback) 
{
	var map = function() 
	{
		var e = {count: 1};

		// get the combined emit key 
		var keyValues = [];
		for (var k in mapReduceKeys) {
			// get the emit key from the MapReduceKey's get() method
			// var f = mapReduceKeys[k].get;
			var f = mapReduceKeys_code[k]; 
			var keyValue = f.call(mapReduceKeys[k], this[k], this);
			if (!keyValue) return;

			if (keyValue instanceof Array) {
				// if the return value can either be an Array, the first element is the emit key and the second
				// is an arbitrary value to be inserted into the data
				keyValues.push(keyValue[0]);
				e[k] = keyValue[1];
			} else {
				// otherwise the the emit key is inserted into the data
				keyValues.push(keyValue);
				e[k] = keyValue;
			}
		}
		var key = keyValues.join('|');

		// copy all value fields for aggregation
		for (var k in valueFields) {
			var valueField = valueFields[k];
			if (this[valueField] != null) {
				if (!e[valueField]) {
					// a value field might also be an emit key field and would be populated with
					// the value from the MapReduceKey's get() 
					e[valueField] = {};
				}
				// the min and max fields are set to the field's value
				e[valueField].min = this[valueField];
				e[valueField].max = this[valueField];
				// if the field is a number, it can be summed and averaged
				if (isNumber(this[valueField])) {
					e[valueField].sum = this[valueField];
				}
			}
		}

		if (stats) {
			stats.running++;
		}

		emit(key, e);
	};

	var reduce = function(key, values) 
	{
		// initialize return object
		var reduced = {count: 0};
		// copy all emit key values from first element
		for (var k in mapReduceKeys) {
			reduced[k] = values[0][k];
		}
		// copy all value fields from first element
		for (var k in valueFields) {
			var valueField = valueFields[k];
			if (values[0][valueField] != null) {
				reduced[valueField] = {};
				// clone all fields so as not to create a reference 
				for (var vk in values[0][valueField]) {
					reduced[valueField][vk] = values[0][valueField][vk];
				}
				// reset min and max since they need to be populated in 
				// the forEach below
				reduced[valueField].min = null;
				reduced[valueField].max = null;
				// if the field is meant to be summed, reset the sum
				if (values[0][valueField].sum != null) {
					reduced[valueField].sum = 0;
				}
			}
		}

		values.forEach(function(doc) {
			// add count from reduced document to total count
			reduced.count += doc.count;
			// iterate all value fields and determine min, max and sum if appicable
			for (var k in valueFields) {
				var valueField = valueFields[k];
				var r = reduced[valueField];
				if (r != null) {
					if (doc[valueField] != undefined) {
						if (doc[valueField].sum != null) {
							r.sum += doc[valueField].sum;
						}
						if (r.min == null || r.min > doc[valueField].min) r.min = doc[valueField].min;
						if (r.max == null || r.max < doc[valueField].max) r.max = doc[valueField].max;
					}
				}
			}
		});

		if (stats && stats.done != stats.running) {
			updateStats(stats);
		}

		return reduced;
	};

	var finalize = function(key, value) 
	{
		// determine average
		for (var k in valueFields) {
			var valueField = valueFields[k];
			if (value[valueField] != null) {
				if (value[valueField].sum != null) {
					value[valueField].avg = value[valueField].sum / value.count;
				}
			}
		}

		return value;
	};

	if (!valueFields) {
		valueFields = ['val'];
	}

	var scope = {
		valueFields: valueFields,
		mapReduceKeys: mapReduceKeys,
		mapReduceKeys_code: {},
	};
	for (var key in scopeFunctions) {
		scope[key] = new Code(mapReduceScopeFunctions[key]);
	}
	// Since we can't pass functions to MongoDB directly, we need to convert
	// them to a Code object first. Note that when these functions are called
	// from the map() function, they are passed the MapReduceKey object.
	for (var key in mapReduceKeys) {
		//console.log('Converting '+key+' to mongodb.Code');
		scope.mapReduceKeys_code[key] = new Code(mapReduceKeys[key].get);
	}

	if (options.scope) {
		for (var k in options.scope) {
			scope[k] = options.scope[k];
		}
	}

	var params = {
		mapreduce: collection
		,map: map.toString()
		,reduce: reduce.toString()
		,finalize: finalize.toString()
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
	for (var k in mapReduceKeys) {
		info.push(mapReduceKeys[k].name || k);
	}

	var db = mongoose.connection;

	/*db.collection(collection).count(params.query, function(err, totalCount) {
		console.log('* running MapReduce for '+totalCount+' '+collection+' to '+reduced_collection+' with key: '+info.join(' | '));*/
		console.log('* running MapReduce for '+collection+' to '+reduced_collection+' with key: '+info.join(' | '));
		mongoose.connection.db.executeDbCommand(params, function(err, op) {
			if (err || (op.documents.length && op.documents[0].errmsg)) {
				if (!err) {
					err = new Error('MongoDB error: '+op.documents[0].errmsg);
				}
				console.error('*** error during MapReduce', err)
			} else {
				for (var k in mapReduceKeys) {
					if (mapReduceKeys[k].index) {
						var field_name = 'value.' + k;
						console.log('* building index for '+field_name+' ...');
						if (!mapReduceKeys[k].index.call(mapReduceKeys[k], 
								db.collection(reduced_collection), field_name)) {
							console.error('ERROR: could not build index');
							return false;
						}
					}
				}
				if (indexes) {
					for (var k in indexes) {
						var field_name = 'value.' + k;
						console.log('* building index for '+field_name+' ...');
						var index = {};
						index[field_name] = indexes[k];
						db.collection(reduced_collection).ensureIndex(index, function(err) {
							if (err) {
								console.error('ERROR: could not build index', err);
								return false;
							}
						});
					}
				}

				console.success('*** SUCCESS', op.documents[0].counts); 
			}

			callback(err);
		});
	/*});*/
};

module.exports = {
	runMapReduce: runMapReduce,
	MapReduceKey: MapReduceKey
}