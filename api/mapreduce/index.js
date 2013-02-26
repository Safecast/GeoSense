// TODO: max parameter should take into account skipped records

var	models = require("../../models.js"),
	Code = require('mongodb').Code,
	mongoose = require('mongoose'),
	config = require('../../config.js'),
	utils = require('../../utils.js'),
	abstraction = require('./mapreduce_abstraction'),
	runMapReduce = abstraction.runMapReduce,
	MapReduceKey = abstraction.MapReduceKey,
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

var runMapReduceForPoints = function(collectionId, mapReduceKeys, opts, callback) 
{
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

var MapReduceAPI = function(app) 
{
};

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
				
				collection.status = !incremental ? 
					config.DataStatus.REDUCING : config.DataStatus.REDUCING_INC;
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