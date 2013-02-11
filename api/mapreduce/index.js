// TODO: max parameter should take into account skipped records

var	models = require("../../models.js"),
	Code = require('mongodb').Code,
	mongoose = require('mongoose'),
	config = require('../../config.js'),
	utils = require('../../utils.js'),
	MapReduceKey = require('./key.js').MapReduceKey,
	mapReduceScopeFunctions = require('./key.js').scopeFunctions,
	console = require('../../ext-console.js'),
	_ = require('cloneextend');

var Point = models.Point,
	PointCollection = models.PointCollection,
	Job = models.Job,
	Map = models.Map,
	handleDbOp = utils.handleDbOp;

var opts = {};
for (var k in config.MAPREDUCE_SETTINGS.DB_OPTIONS) {
	opts[k] = config.MAPREDUCE_SETTINGS.DB_OPTIONS[k];
}

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
	for (var key in mapReduceScopeFunctions) {
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
						db.collection(reduced_collection).ensureIndex(index);
						if (!utils.collectionHasIndex(db.collection(reduced_collection), index)) {
							console.error('ERROR: could not build index');
							return false;
						}
					}
				}

				console.success('*** SUCCESS', op.documents[0].counts); 
			}

			callback(err);
		});
	/*});*/
};

var runMapReduceForPoints = function(collectionId, mapReduceKeys, opts, callback) {
	var collection = 'points';
	var info = ['r', collection];
	for (var k in mapReduceKeys) {
		if (mapReduceKeys[k].name) {
			info.push(mapReduceKeys[k].name);
		}
	}
	var reduced_collection = info.join('_');
	if (!opts.query) {
		opts.query = {};
	}
	opts.query.pointCollection = new mongoose.Types.ObjectId(collectionId);

	var valueFields = opts.valueFields;
	if (!valueFields) {
		valueFields = ['val', 'label', 'description'];
		if (!mapReduceKeys['datetime']) {
			valueFields.push('datetime');
		}
	}

	if (!opts.scope) {
		opts.scope = {};
	}

	if (opts.stats) {
		opts.scope.stats = {
			collectionId: opts.stats.collectionId,
			total: opts.stats.total,
			done: 0,
			running: 0
		};
		opts.scope.updateStats = new Code(function(stats) {
			if (stats.running / stats.total > .001) {
				stats.done += stats.running;
				db.pointcollections.update({_id: stats.collectionId}, {$inc: {progress: stats.running}});
				stats.running = 0;
			}
		});
	} else {
		opts.scope.stats = false;
	}	

	var callRunMapReduce = function() {
		runMapReduce(collection, reduced_collection, valueFields, mapReduceKeys, {
				count: 1,
				'val.avg': 1,
				'val.min': 1,
				'val.max': 1,
				pointCollection: 1,
				datetime: 1
			}, opts, callback);	
	}; 

	if (opts.removeFirst) {
		var db = mongoose.connection;
		if (opts.query && opts.query.pointCollection) {
			console.warn('* removing existing reduction for '+opts.query.pointCollection.toString());
			db.collection(reduced_collection).remove({
				'value.pointCollection': opts.query.pointCollection
			}, callRunMapReduce);
		} else {
			console.warn('* dropping '+reduced_collection);
			db.collection(reduced_collection).drop(callRunMapReduce);
		}
	} else {
		callRunMapReduce();
	}

};



var MapReduceAPI = function(app) {
}

MapReduceAPI.prototype.mapReduce = function(params, req, res, callback)
{
	if (!params) {
		params = {};
	}
	if (!params.options) {
		params.options = config.MAPREDUCE_SETTINGS.OPTIONS;
	}
	console.log('mapReduce with params', params);
	Job.findOne({status: config.JobStatus.ACTIVE, type: config.JobType.REDUCE}, function(err, job) {
		if (job && job.status != config.JobStatus.IDLE) {
			// tmp
			/*console.log('*** Another reduction job ' + job._id + ' has not been finished: quitting ***');
			if (callback) {
				callback();
			}
			return;*/
		} else {
			job = new Job({status: config.JobStatus.ACTIVE, type: config.JobType.REDUCE, updatedAt: new Date, createdAt: new Date});
		}

		PointCollection.findOne({_id: params.pointCollectionId}, function(err, collection) {
			if (!utils.validateExistingCollection(err, collection, callback)) return;
			job.save(function(err, job) {
				var opts = {};
				for (var k in config.MAPREDUCE_SETTINGS.DB_OPTIONS) {
					opts[k] = config.MAPREDUCE_SETTINGS.DB_OPTIONS[k];
				}

				opts.query = {};
				var incremental = collection.lastReducedAt && !params.rebuild;
				opts.removeFirst = !incremental;

				//var statsTotal = db.points.count(opts.query ... and pointCollection) * (config.NUM_ZOOM_LEVELS + numHistograms);
				//opts.stats = {total: statsTotal, collectionId: collection._id};
				//db.pointcollections.update({_id: collection._id}, {$set: {status: config.DataStatus.REDUCING, progress: 0, numBusy: statsTotal}});
				
				collection.status = config.DataStatus.REDUCING;
				//collection.progress = 0;
				//collection.numBusy: statsTotal;

				collection.save(function(err, collection) {
					var reducedAt = new Date;
					var mapReduceCalls = [];

					console.info('*** collection = '+collection.title+' ('+collection._id+') ***');

					if (incremental) {
						opts.query.createdAt = {$gt: collection.lastReducedAt};
						console.log('*** incremental reduction of points created > '+collection.lastReducedAt);
					}

					for (var i = 0; i < config.HISTOGRAM_SIZES.length; i++) {
						if (params.options.histogram) {
							mapReduceCalls.push([
								'*** reducing for histogram = '+config.HISTOGRAM_SIZES[i]+' ***', 
								{
									pointCollection: new MapReduceKey.Copy(), 
									val: new MapReduceKey.Histogram(collection.minVal, collection.maxVal, config.HISTOGRAM_SIZES[i]),
								}
							]);
						}
					}

					if (!collection.reduce || collection.gridSize) {
						if (params.options.unreduced) {
							mapReduceCalls.push([
								'*** creating unreduced copy of original ***', 
								{
									pointCollection: new MapReduceKey.Copy(), 
									loc: new MapReduceKey.LocGrid(0)
								}
							]);
						}
					} 

					if (collection.reduce) {

						for (var g in config.GRID_SIZES) {
							var grid_size = config.GRID_SIZES[g];
							if ((!collection.gridSize || grid_size > collection.gridSize) && (!collection.maxReduceZoom || g <= collection.maxReduceZoom)) {

								if (params.options.grid) {
									mapReduceCalls.push([
										'*** MapReduce for zoom = '+g+' ***', 
										{
											pointCollection: new MapReduceKey.Copy(), 
											loc: new MapReduceKey.LocGrid(grid_size)
										}
									]);
								}
					
								if (params.options.timebased && collection.timeBased) {
									mapReduceCalls.push([
										'*** MapReduce for time-based zoom = '+g+' ***', 
										{
											pointCollection: new MapReduceKey.Copy(), 
											loc: new MapReduceKey.LocGrid(grid_size), 
											datetime: new MapReduceKey.Yearly()
										}
									]);
								}
							}
						}
					}

					var finalize = function(err) {
						if (!err) {
							console.success('*** MapReduce completed successfully ***');
						}
						collection.status = config.DataStatus.COMPLETE;
						collection.lastReducedAt = reducedAt;
						collection.save(function(err, collection) {
							job.status = config.JobStatus.IDLE;
							job.updatedAt = new Date;
							job.save(function(err) {
								if (callback) {
									callback(err);
								}
							});
						});
					};

					var dequeueMapReduceCall = function() {
						if (!mapReduceCalls.length) {
							finalize();
						} else {
							var call = mapReduceCalls.shift();
							console.info(call[0]);
							runMapReduceForPoints(params.pointCollectionId, call[1], opts, function(err, res) {
								if (err) {
									console.error('*** error during MapReduce ***')
									callback(err);									
								} else {
									dequeueMapReduceCall();
								}
							});
						}
					};
					
					dequeueMapReduceCall();

				});
			});
		});
	});
};

MapReduceAPI.prototype.mapReduceAll = function(params, req, res, callback)
{
	var self = this;
	if (!params) {
		params = {};
	}
	PointCollection.find({$or: [{status: config.DataStatus.UNREDUCED}, {status: config.DataStatus.UNREDUCED_INC}]}, function(err, collections) {
		console.info('*** Collections to reduce: ' + collections.length);
		if (err) {
			if (callback) {
				callback(err);
			}
		}
		var dequeuePointCollection = function(err) {
			if (err || !collections.length) {
				if (callback) {
					callback(err);
				}
			} else {
				var collection = collections.pop();
				params.pointCollectionId = collection._id.toString();
				self.mapReduce(params, req, res, dequeuePointCollection);
			}
		}
		dequeuePointCollection();
	});
}

MapReduceAPI.prototype.cli = {
	
	mapreduce: function(params, callback, showHelp) 
	{
		var help = "Usage: node manage.js mapreduce [params]\n"
			+ "\nRuns MapReduce for currently unreduced collections.\n"
			+ "\nOptional Parameters:\n"
			+ '\n    --options "[grid],[timebased],[unreduced],[histogram]"\n'
			+ '          Performs selective MapReduce only of the entered types.\n'
			+ '\n    --rebuild\n'
			+ '          Force complete rebuild even if MapReduce was already completed.\n'

		if (!showHelp && utils.connectDB()) {
			if (params._.length) {
				params.pointCollectionId = params._[1];
			}
			if (params.options) {
				var split = (params.options + '').split(',');
				params.options = {};
				for (var i = 0; i < split.length; i++) {
					params.options[split[i]] = true; 
				}
			}
			if (params.pointCollectionId) {
				this.mapReduce(params, null, null, callback);
			} else {
				this.mapReduceAll(params, null, null, callback);
			}
		} else {
			callback(false, help);
		}
	}
}

module.exports = MapReduceAPI;