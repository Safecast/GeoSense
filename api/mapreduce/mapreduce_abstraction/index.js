var	Code = require('mongodb').Code,
	mongoose = require('mongoose'),
	keys = require('./keys.js'),
	EmitKey = keys.EmitKey,
	scopeFunctions = keys.scopeFunctions,
	getAttr = keys.scopeFunctions.getAttr,
	console = require('../../../ext-console.js');


var mongoMapReduceFunctions = 
{
	map: function() 
	{
		var emitted = {count: 1};

		// get the combined emit key 
		var keySegments = [];
		for (var k in emitKeys) {
			// get the emit key from the EmitKey's get() method
			// var f = emitKeys[k].get;
			var f = emitKeys_code[k]; 
				keyContent = f.call(emitKeys[k], getAttr(this, k), this);
			if (!keyContent) return;

			if (isArray(keyContent)) {
				// if the return value is an Array, the first element is the emit key content
				// and the second is an arbitrary value to be inserted into the data
				keySegments.push(keyContent[0]);
				setAttr(emitted, k, keyContent[1]);
			} else {
				// otherwise the the emit key content is inserted into the data
				keySegments.push(keyContent);
				setAttr(emitted, k, keyContent);
			}
		}
		var fullKey = keySegments.join(KEY_SEPARATOR);


		// call findExtremes to initialize each aggregate field 
		iterFields(aggregates, this, function(fieldName, doc) {
			setAttr(emitted, fieldName, findExtremes(getAttr(doc, fieldName)));
		});

		if (events.emit) {
			events.emit(fullKey, emitted);
		}

		emit(fullKey, emitted);
	},

	reduce: function(key, docs) 
	{
		// initialize return object
		var reduced = {count: 0};
		// copy all emit key values from first element
		for (var k in emitKeys) {
			setAttr(reduced, k, getAttr(docs[0], k));
		}

		docs.forEach(function(doc) {
			// add count from reduced document to total count
			reduced.count += doc.count;
			// call findExtremes over all aggregate values
			iterFields(aggregates, doc, function(fieldName, doc) {
				setAttr(reduced, fieldName, findExtremes(getAttr(doc, fieldName), getAttr(reduced, fieldName)));
			});
		});

		if (events.reduce) {
			events.reduce(key, reduced);
		}

		return reduced;
	},

	finalize: function(key, doc) 
	{
		// determine average
		iterFields(aggregates, doc, function(fieldName, doc) {
			var extremes = getAttr(doc, fieldName);
			// doc.extremes is modified by reference
			if (extremes.min == extremes.max) {
				extremes.value = extremes.min;
				delete(extremes.min);
				delete(extremes.max);
			}
			if (!isNaN(extremes.sum)) {
				extremes.avg = extremes.sum / extremes.count;
			} else {
				delete extremes.sum;
			}
		});

		if (events.finalize) {
			events.finalize(key, doc);
		}

		return doc;
	}
};


var runMapReduce = function(collectionName, outputCollectionName, emitKeys, options, callback) 
{
	var options = options || {};

	var scope = {
		aggregates: !options.aggregates ? []
			: (isArray(options.aggregates) ? options.aggregates : [options.aggregates]),
		emitKeys: emitKeys,
		emitKeys_code: {},
		events: {},
		KEY_SEPARATOR: keys.KEY_SEPARATOR
	};

	// Pass all utility functions with the scope that is available to MongoDB
	// during the MapReduce operation.
	// Since we can't pass functions to MongoDB directly, we need to convert
	// them to a Code object first.	
	for (var scopeName in scopeFunctions) {
		scope[scopeName] = new Code(scopeFunctions[scopeName]);
	}

	// Pass all utility functions with the scope that is available to MongoDB
	// during the MapReduce operation.
	// Since we can't pass functions to MongoDB directly, we need to convert
	// them to a Code object first.	
	for (var eventName in options.events || {}) {
		scope.events[eventName] = new Code(options.events[eventName]);
	}

 	// Same goes for all EmitKey get methods. 
 	// Note that when these functions are called from the map() function, 
 	// they are passed the EmitKey object.
	for (var keyName in emitKeys) {
		scope.emitKeys_code[keyName] = new Code(emitKeys[keyName].get);
	}

	if (options.scope) {
		for (var k in options.scope) {
			scope[k] = options.scope[k];
		}
	}

	var params = {
		mapreduce: collectionName
		,map: mongoMapReduceFunctions.map.toString()
		,reduce: mongoMapReduceFunctions.reduce.toString()
		,finalize: mongoMapReduceFunctions.finalize.toString()
		,out: {reduce: outputCollectionName}
		,scope: scope
		,verbose: true
		,keeptemp: true
	};

	for (k in options) {
		if (k != 'scope') {
			params[k] = options[k];
		} 
	}

	var info = [];
	for (var k in emitKeys) {
		info.push(emitKeys[k].name || k);
	}

	var db = mongoose.connection;

	/*db.collection(collectionName).count(params.query, function(err, totalCount) {
		console.log('  * running MapReduce for '+totalCount+' '+collectionName+' to '+outputCollectionName+' with key: '+info.join(' | '));*/
		console.info('  * running MapReduce for collection ' + collectionName + ' ==> ' + outputCollectionName);
		console.info('  * emit key: '+info.join(keys.KEY_SEPARATOR));
		console.info('  * aggregate values: '+scope.aggregates.join(', '));
		mongoose.connection.db.executeDbCommand(params, function(err, op) {
			if (err || (op.documents.length && op.documents[0].errmsg)) {
				if (!err) {
					err = new Error('MongoDB error: ' + op.documents[0].errmsg);
				}
				console.error('   * error during MapReduce', err)
			} else {

				console.success('  * done. ensuring required indexes ...');
				for (var k in emitKeys) {
					if (emitKeys[k].index) {
						var fieldName = 'value.' + k;
						console.log('  * building key index for '+fieldName+' ...');
						if (!emitKeys[k].index.call(emitKeys[k], 
								db.collection(outputCollectionName), fieldName)) {
							console.error('ERROR: could not build index');
							//return false;
						}
					}
				}
				if (options.indexes) {
					for (var k in options.indexes) {
						var fieldName = 'value.' + k;
						console.log('  * building index for '+fieldName+' ...');
						var index = {};
						index[fieldName] = options.indexes[k];
						db.collection(outputCollectionName).ensureIndex(index, function(err) {
							if (err) {
								console.error('ERROR: could not build index', err);
								//return false;
							}
						});
					}
				}

				console.success('  * MapReduce successful', op.documents[0].counts); 
			}

			callback(err);
		});
	/*});*/
};

module.exports = {
	runMapReduce: runMapReduce,
	EmitKey: EmitKey,
	getAttr: getAttr
}