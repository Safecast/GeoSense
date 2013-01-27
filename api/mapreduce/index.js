// TODO: max parameter should take into account skipped records

var	models = require("../../models.js"),
	Code = require('mongodb').Code,
	mongoose = require('mongoose'),
	config = require('../../config.js'),
	utils = require('../../utils.js'),
	MapReduceKey = require('./key.js').MapReduceKey,
	mapReduceScopeFunctions = require('./key.js').scopeFunctions,
	console = require('../../ext-console.js');

var Point = models.Point,
	PointCollection = models.PointCollection,
	Job = models.Job,
	Map = models.Map,
	handleDbOp = utils.handleDbOp;

var opts = {};
for (var k in config.REDUCE_SETTINGS.DB_OPTIONS) {
	opts[k] = config.REDUCE_SETTINGS.DB_OPTIONS[k];
}

var runMapReduce = function(collection, reduced_collection, valueFields, mapReduceKeys, indexes, options, callback) 
{
	var map = function() 
	{
		var keyValues = [];
		var e = {count: 1};
		for (var k in mapReduceKeys) {
			//var f = mapReduceKeys[k].get || mapReduceKeys[k];
			var f = mapReduceKeys_code[k];
			var keyValue = f.call(mapReduceKeys[k], this[k], this);
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
		for (var k in valueFields) {
			var valueField = valueFields[k];
			if (this[valueField] != null) {
				if (this[valueField] instanceof Array) {
					e[valueField] = [];
					for (var v = 0; v < this[valueField].length; v++) {
						e[valueField][v] = {
							min: this[valueField][v],
							max: this[valueField][v]
						};
						if (isNumber(this[valueField][v]) || valueField == 'extra') {
							e[valueField][v].sum = this[valueField][v];
						}
					}
				} else {
					e[valueField] = {
						min: this[valueField],
						max: this[valueField]
					};
					if (isNumber(this[valueField]) || valueField == 'extra') {
						e[valueField].sum = this[valueField];
					}
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
		var reduced = {count: 0};
		for (var k in mapReduceKeys) {
			reduced[k] = values[0][k];
		}
		for (var k in valueFields) {
			var valueField = valueFields[k];
			if (values[0][valueField] != null) {
				if (values[0][valueField] instanceof Array) {
					reduced[valueField] = [];
					for (var v = 0; v < values[0][valueField].length; v++) {
						reduced[valueField][v] = {
							min: null,
							max: null
						};
						if (values[0][valueField][v].sum != null) {
							reduced[valueField][v].sum = 0;
						}
					}
				} else {
					if (valueField == 'extra') {
						reduced[valueField] = {
							min: {},
							max: {}
						};
						if (values[0][valueField].sum != null) {
							reduced[valueField].sum = {};
						}
					} else {
						reduced[valueField] = {
							min: null,
							max: null
						};
						if (values[0][valueField].sum != null) {
							reduced[valueField].sum = 0;
						}
					}
				}
			}
		}

		values.forEach(function(doc) {
			reduced.count += doc.count;
			for (var k in valueFields) {
				var valueField = valueFields[k];
				var r = reduced[valueField];
				if (r != null) {
					if (r instanceof Array) {
						for (var v = 0; v < r.length; v++) {
							if (doc[valueField][v].sum != null) {
								r[v].sum += doc[valueField][v].sum;
							}
							if (r[v].min == null || r[v].min > doc[valueField][v].min) r[v].min = doc[valueField][v].min;
							if (r[v].max == null || r[v].max < doc[valueField][v].max) r[v].max = doc[valueField][v].max;
						}
					} else if (valueField == 'extra') {
						for (var objKey in doc[valueField].min) {
							var vMin = doc[valueField].min[objKey];
							var vMax = doc[valueField].max[objKey];
							if (r.min[objKey] == undefined || r.min[objKey] > vMin) r.min[objKey] = vMin;
							if (r.max[objKey] == undefined || r.max[objKey] < vMax) r.max[objKey] = vMax;
							if (doc[valueField].sum != null) {
								var vSum = doc[valueField].sum[objKey];
								if (isNumber(vSum)) {
									if (!r.sum[objKey]) {
										r.sum[objKey] = 0;
									}
									r.sum[objKey] += vSum;
								} else {
									delete r.sum[objKey];
								}
							}
						}
					} else if (doc[valueField] != undefined) {
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
		for (var k in valueFields) {
			var valueField = valueFields[k];
			if (value[valueField] != null) {
				if (value[valueField] instanceof Array) {
					for (var v = 0; v < value[valueField].length; v++) {
						if (value[valueField][v].sum != null) {
							value[valueField][v].avg = value[valueField][v].sum / value.count;
						}
					}
				} else {
					if (value[valueField].sum != null) {
						if (valueField == 'extra') {
							value[valueField].avg = {};
							for (var objKey in value[valueField].sum) {
								value[valueField].avg[objKey] = value[valueField].sum[objKey] / value.count;
							}
						} else {
							value[valueField].avg = value[valueField].sum / value.count;
						}
					}
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
		valueFields = ['val', 'altVal', 'label', 'extra'];
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
				for (var k in config.REDUCE_SETTINGS.DB_OPTIONS) {
					opts[k] = config.REDUCE_SETTINGS.DB_OPTIONS[k];
				}

				opts.query = {};
				var incremental = collection.lastReducedAt;
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
						mapReduceCalls.push([
							'*** reducing for histogram = '+config.HISTOGRAM_SIZES[i]+' ***', 
							{
								pointCollection: new MapReduceKey.Copy(), 
								val: new MapReduceKey.Histogram(collection.minVal, collection.maxVal, config.HISTOGRAM_SIZES[i]),
							}
						]);
					}

					if (!collection.reduce || collection.gridSize) {
						mapReduceCalls.push([
							'*** creating unreduced copy of original ***', 
							{
								pointCollection: new MapReduceKey.Copy(), 
								loc: new MapReduceKey.LocGrid(0)
							}
						]);
					} 


					if (collection.reduce) {

						for (var g in config.GRID_SIZES) {
							var grid_size = config.GRID_SIZES[g];
							if ((!collection.gridSize || grid_size > collection.gridSize) && (!collection.maxReduceZoom || g <= collection.maxReduceZoom)) {

								mapReduceCalls.push([
									'*** MapReduce for zoom = '+g+' ***', 
									{
										pointCollection: new MapReduceKey.Copy(), 
										loc: new MapReduceKey.LocGrid(grid_size)
									}
								]);
					
								if (config.REDUCE_SETTINGS.TIME_BASED && collection.timeBased) {
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
			+ "\nRuns MapReduce for currently unreduced collections.\n";

		if (!showHelp && utils.connectDB()) {
			if (params._.length) {
				params.pointCollectionId = params._[1];
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