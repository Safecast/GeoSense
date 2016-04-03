// TODO: max parameter should take into account skipped records

var	models = require('../../models.js'),
	geogoose = require('geogoose'),
	Code = require('mongodb').Code,
	mongoose = require('mongoose'),
	config = require('../../config.js'),
	utils = require('../../utils.js'),
	rejuice = require('rejuice'),
	runMapReduce = rejuice.mongoose.runMapReduce,
	Mapper = rejuice.Mapper,
	getAttr = require('transmeta').util.getAttr,
	console = require('../../ext-console.js'),
	_ = require('underscore');

var GeoFeatureCollection = models.GeoFeatureCollection,
	Job = models.Job,
	Map = models.Map,
	handleDbOp = utils.handleDbOp;

var opts = {};
for (var k in config.MAPREDUCE_SETTINGS.DB_OPTIONS) {
	opts[k] = config.MAPREDUCE_SETTINGS.DB_OPTIONS[k];
}

var runMapReduceForFeatureCollection = function(collection, mappers, opts, callback)
{
	var collectionName = collection.getFeatureModel().collection.name;
	var info = ['r', collectionName];
	for (var k in mappers) {
		if (mappers[k].name) {
			info.push(mappers[k].name);
		}
	}
	var outputCollectionName = info.join('_');
	if (!opts.query) {
		opts.query = {};
	}
	//opts.query.featureCollection = collection._id;
	if (!opts.scope) {
		opts.scope = {};
	}
	opts.scope.DEBUG = config.DEBUG_MAPREDUCE;
	opts.scope.preSave = geogoose.models.GeoFeatureSchemaMiddleware.pre.save;

	if (opts.stats) {
		opts.scope.stats = {
			collectionId: collection._id.toString(),
			total: opts.stats.total,
			done: 0,
			running: 0
		};
		opts.scope.updateStats = new Code(function(stats) {
			if (stats.running / stats.total > .001) {
				stats.done += stats.running;
				db.GeoFeatureCollections.update({_id: stats.collectionId}, {$inc: {progress: stats.running}});
				stats.running = 0;
			}
		});
	} else {
		opts.scope.stats = false;
	}

	var callRunMapReduce = function() {
		runMapReduce(collectionName, outputCollectionName, mappers, opts, callback);
	};

	if (opts.removeFirst) {
		var db = mongoose.connection;
		if (opts.query && opts.query.GeoFeatureCollection) {
			console.warn('  * removing existing reduction for '+opts.query.GeoFeatureCollection.toString());
			db.collection(outputCollectionName).remove({
				'value.GeoFeatureCollection': opts.query.GeoFeatureCollection
			}, callRunMapReduce);
		} else {
			console.warn('  * dropping '+outputCollectionName);
			db.collection(outputCollectionName).drop(callRunMapReduce);
		}
	} else {
		callRunMapReduce();
	}

};

var AggregateAPI = function(app)
{
};

AggregateAPI.prototype.aggregate = function(params, req, res, callback)
{
	if (!params) {
		params = {};
	} else {
		params = _.clone(params);
	}
	if (params.zoom && !Array.isArray(params.zoom)) {
		params.zoom = [params.zoom];
		params.zoom = params.zoom.map(function(value) { return value + ''; });
	}

	if (!params.types) {
		params.types = config.MAPREDUCE_SETTINGS.DEFAULT_ENABLED_TYPES;
	}

	if (!params.types || !params.types.length) {
		if (utils.callbackOrThrow(new Error('No MapReduce types specified'))) return;
	}

	console[console.success ? 'success' : 'info']('*** MapReduce with types:', params.types.join(', '));
	if (params.zoom) {
		console.info('*** zoom levels:', params.zoom);
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

		if (!params.featureCollectionId) {
			if (utils.callbackOrThrow(new Error('params.featureCollectionId not specified'), callback)) return;
		}

		GeoFeatureCollection.findOne({_id: params.featureCollectionId})
			.populate('defaults')
			.exec(function(err, collection) {
				if (!utils.validateExistingCollection(err, collection, callback, params.force)) return;
				job.save(function(err, job) {

					var opts = {};
					for (var k in config.MAPREDUCE_SETTINGS.DB_OPTIONS) {
						opts[k] = config.MAPREDUCE_SETTINGS.DB_OPTIONS[k];
					}

					var attrMap = params.attrMap || 
						((collection.defaults && collection.defaults.attrMap) ? collection.defaults.attrMap : {}),
						geometryAttr = attrMap.geometry || 'geometry';

					opts.query = {};
					var incremental = collection.lastReducedAt && !params.rebuild;
					opts.removeFirst = !incremental;

					if (opts.aggregates == undefined) {
						opts.aggregates = ['properties.*'];
					}

					//var statsTotal = db.points.count(opts.query ... and GeoFeatureCollection) * (config.NUM_ZOOM_LEVELS + numHistograms);
					//opts.stats = {total: statsTotal, collectionId: collection._id};
					//db.GeoFeatureCollections.update({_id: collection._id}, {$set: {status: config.DataStatus.REDUCING, progress: 0, numBusy: statsTotal}});

					collection.status = !incremental ?
						config.DataStatus.REDUCING : config.DataStatus.REDUCING_INC;
					//collection.progress = 0;
					//collection.numBusy: statsTotal;

					collection.save(function(err, collection) {
						if (utils.callbackOrThrow(err, callback)) return;
						var reducedAt = new Date,
							mapReduceArguments = [],
							mr = function() {
								mapReduceArguments.push(arguments);
							},
							makeObj = function() {
								var obj = {};
								// makes an object out of key, value pairs passed to this function
								for (var i = 0; i < arguments.length; i += 2) {
									obj[arguments[i]] = arguments[i + 1];
								}
								return obj;
							};

						console.info('*** collection = '+collection.title+' ('+collection._id+') ***');

						if (incremental) {
							opts.query.createdAt = {$gt: collection.lastReducedAt};
							console.warn('*** incremental reduction of points created > '+collection.lastReducedAt);
						}

						// Initialize MapReduce for histograms
						if (attrMap.numeric && params.types.indexOf('histogram') != -1) {
							var numericExtremes = getAttr(collection.extremes, attrMap.numeric),
								numericField = collection.getAttributeField(attrMap.numeric),
								isInteger = numericField && numericField.info && numericField.info.isInteger,
								properties = rejuice.util.getHistogramDimensions(numericExtremes.min, numericExtremes.max, config.HISTOGRAM_DESIRED_SIZE, isInteger);
							if (numericExtremes == undefined || numericExtremes.min == undefined || numericExtremes.max == undefined) {
								if (utils.callbackOrThrow(new Error('undefined extremes for ' + attrMap.numeric), callback)) return;
							}
							properties.name = 'auto';
							var mapper = new Mapper.Histogram(properties.min, properties.max, properties.numBins, properties.binSize);
							mapper.name = 'histogram_' + properties.name;

							collection.histogramProperties = properties;

							mr('*** MapReduce for histogram ' + properties.min + ' .. ' + properties.max + ', isInteger = ' + isInteger + ', bins = ' + properties.numBins, makeObj(
								//'featureCollection', new Mapper.Copy(),
								attrMap.numeric, mapper),
									{ events: null, indexes: {'bin': 1}, aggregates: false, copy: "bin"}
							);
						}

						if (collection.tile) {
							for (var g in config.GRID_SIZES) {
								var gridSize = config.GRID_SIZES[g],
									tileEvents = {
										finalize: function(key, doc) {
											preSave.call(doc);
										}
									},
									tileIndexes = {
										'geometry': '2dsphere'
									};
								if (attrMap.numeric) {
									tileIndexes[attrMap.numeric] = 1;
								}

								// Initialize MapReduce for tiles
								if (params.types.indexOf('tile') != -1
									&& (!params.zoom || params.zoom.indexOf(g) != -1)
									&& (!collection.gridSize || gridSize > collection.gridSize)
									&& (!collection.maxReduceZoom || g <= collection.maxReduceZoom)) {

									mr('*** MapReduce for tiles at zoom = ' + g + ' ***', makeObj(
										//'featureCollection', new Mapper.Copy(),
										geometryAttr, new Mapper.Tile[collection.tile](gridSize, gridSize, {index: false})),
										{ events: tileEvents, indexes: tileIndexes }
									);
								}

								// Initialize MapReduce for time-based tiles
								if (attrMap.datetime) {
									for (var timebase in Mapper.Time) {
										if (params.types.indexOf('tile-' + timebase.toLowerCase()) != -1) {
											tileIndexes[attrMap.datetime] = '1';

											mr('*** MapReduce for ' + timebase.toLowerCase() + ' tiles at zoom = '+g+' ***', makeObj(
												//'featureCollection', new Mapper.Copy(),
												geometryAttr, new Mapper.Tile.Rect(gridSize, gridSize, {index: false}),
												attrMap.datetime, new Mapper.Time[timebase]()),
												{ events: tileEvents, indexes: tileIndexes }
											);
										}
									}
								}
							}
						}

						// Initialize MapReduce for time-based overall
						if (attrMap.datetime) {
							for (var timebase in Mapper.Time) {
								if (params.types.indexOf(timebase.toLowerCase()) != -1) {
									mr('*** MapReduce for ' + timebase.toLowerCase() + ' overall ***', makeObj(
										//'featureCollection', new Mapper.Copy(),
										attrMap.datetime, new Mapper.Time[timebase]()),
										{ events: null, indexes: null }
									);
								}
							}
						}

						var dequeueMapReduceCall = function()
						{
							if (!mapReduceArguments.length) {
								console[console.success ? 'success' : 'info']('*** MapReduce completed ***');
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
							} else {
								var args = mapReduceArguments.shift(),
									mappers = {};
								// the first element is a comment
								console.info(args[0]);
								runMapReduceForFeatureCollection.call(this, collection, args[1], _.extend(_.clone(opts), args[2]), function(err, res) {
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

AggregateAPI.prototype.aggregateAll = function(params, req, res, callback)
{
	var self = this;
	if (!params) {
		params = {};
	}
	GeoFeatureCollection.find({$or: [{status: config.DataStatus.UNREDUCED}, {status: config.DataStatus.UNREDUCED_INC}]}, function(err, collections) {
		console.info('*** Collections to reduce: ' + collections.length);
		if (err) {
			if (callback) {
				callback(err);
			}
		}
		var dequeueGeoFeatureCollection = function(err) {
			if (err || !collections.length) {
				if (callback) {
					callback(err);
				}
			} else {
				var collection = collections.pop();
				params.featureCollectionId = collection._id.toString();
				self.aggregate(params, req, res, dequeueGeoFeatureCollection);
			}
		}
		dequeueGeoFeatureCollection();
	});
}

AggregateAPI.prototype.cli = {

	aggregate: function(params, callback, showHelp)
	{
		var help = "Usage: node manage.js aggregate [params]\n"
			+ "\nRuns MapReduce for currently unreduced collections.\n"
			+ "\nOptional Parameters:\n"
			+ '\n    --types "[tile],[tile-yearly],[tile-monthly],[tile-daily],[yearly],[monthly],[daily],[unreduced],[histogram]"\n'
			+ '          Performs selective MapReduce only of the entered types.\n'
			+ '\n    --rebuild\n'
			+ '          Force complete rebuild even if MapReduce was already completed.\n'
			+ '\n    --zoom level[-tolevel]\n'
			+ '          Performs aggregation for the supplied range of zoom levels.\n'

		if (!showHelp && utils.connectDB()) {
			if (params._.length) {
				params.featureCollectionId = params._[1];
			}
			if (params.types) {
				params.types = (params.types + '').split(',');
			}
			if (params.zoom) {
				var match = (params.zoom + '').match(/^([0-9]+)(\-([0-9]+))?$/);
				params.zoom = [];
				if (match) {
					for (var i = Math.min(match[1], match[3] || match[1]); i <= Math.max(match[1], match[3] || match[1]); i++) {
						params.zoom.push(i + '');
					}
				}
			}
			if (params.featureCollectionId) {
				this.aggregate(params, null, null, callback);
			} else {
				this.aggregateAll(params, null, null, callback);
			}
		} else {
			callback(false, help, true);
		}
	}

}

module.exports = AggregateAPI;
