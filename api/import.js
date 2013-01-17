var config = require('../config.js'),
	models = require("../models.js"),
	permissions = require("../permissions.js"),
	utils = require("../utils.js"),
	conversion = require("./conversion/conversion.js"),
  	mongoose = require('mongoose'),
	date = require('datejs'),
	url = require('url'),
	_ = require('cloneextend'),
	path = require('path'),
	console = require('../ext-console.js');

var Point = models.Point,
	PointCollection = models.PointCollection,
	LayerOptions = models.LayerOptions,
	handleDbOp = utils.handleDbOp;

var ImportAPI = function(app) {
	var self = this;
	if (app) {
		app.post('/api/import/', function(req, res) {
			self.import(req.body, req, res);
		});
	}
}

ImportAPI.prototype.validateExistingCollection = function(err, collection, callback)
{
	if (err || !collection) {
		if (!err) {
			err = new Error('PointCollection not found');
		}
		if (callback) {
			callback(err);
		} else {
			console.error(err.message);
		}
		return false;
	}
	if (collection.status == config.DataStatus.IMPORTING || collection.status == config.DataStatus.REDUCING) {
		var err = new Error('Collection is currently busy');
		console.error(err.message);
		if (callback) {
			callback(err);
		}
		return false;
	}

	return true;
}

/**
required params:
	url | file | stream
	format
optional params:
	converter
	max
	skip
	append
	incremental
*/
ImportAPI.prototype.import = function(params, req, res, callback)
{
	var self = this;

	var defaults = {
		url: null, path: null, stream: null,
		format: null,
		converter: 'base',
		max: 0,
		interval: 1,
		skip: 0,
		incremental: false
	};

	var allowedHeaderValues = {
		gridSize: null
	};

	var params = _.cloneextend(defaults, params);

	if (!params.format && params.path) {
		params.format = params.path.split('.').pop();
	}

	if (utils.isEmpty(params.max)) {
		params.max = defaults.max;
	}
	if (utils.isEmpty(params.skip)) {
		params.skip = defaults.skip;
	}
	if (utils.isEmpty(params.interval)) {
		params.interval = defaults.interval;
	}
	if (params.from) {
		params.from = new Date(params.from);
	}
	if (params.to) {
		params.to = new Date(params.to);
	}
	if (utils.isEmpty(params.url) && utils.isEmpty(params.path)) {
		var err = new Error('must specify url or path');
		if (callback) {
			callback(err);
			return;
		}
		throw err;
	}
	if (typeof params.format != 'string') {
		var err = new Error('invalid format');
		if (callback) {
			callback(err);
			return;
		}
		throw err;
	}
	if (params.format) {
		params.format = path.basename(params.format);
	}
	if (typeof params.converter != 'string') {
		var err = new Error('invalid converter: ' + params.converter);
		if (callback) {
			callback(err);
			return;
		}
		throw err;
	}
	if (params.converter) {
		params.converter = path.basename(params.converter);
	}

	if (params.bounds) {
		if (typeof params.bounds == 'string') {
			var b = params.bounds.split(',');
			params.bounds = [[parseFloat(b[0]), parseFloat(b[1])], [parseFloat(b[2]), parseFloat(b[3])]];
		}
		if (params.bounds.length < 2 || params.bounds[0].length < 2 || params.bounds[1].length > 2
			|| isNaN(params.bounds[0][0]) || isNaN(params.bounds[0][1]) || isNaN(params.bounds[1][0]) || isNaN(params.bounds[1][1])) {
				var err = new Error('invalid bounds: ' + params.bounds);
				if (callback) {
					callback(err);
					return;
				}
				throw err;
		} 
	}

	console.log('import params', params);

	converter = require('./conversion/point/' 
		+ (params.converter && params.converter != '' ? params.converter : 'base') 
		+ '.js').PointConverter;

	var importCount = 0;
	var fieldNames;
	var FIRST_ROW_IS_HEADER = params.format == 'csv';
	var originalCollection = 'o_' + new mongoose.Types.ObjectId();
	var Model = mongoose.model(originalCollection, new mongoose.Schema({ any: {} }), originalCollection);
	
	var runImport = function(collection) 
	{
		var headerValues = {};
		collection.active = false;
		collection.status = config.DataStatus.IMPORTING;
		collection.importParams = params;
		if (req && req.session) {
			collection.createdBy = collection.modifiedBy = req.session.user;
		}
		collection.save(function(err, collection) {
			if (err) {
				console.error(err.message);
				if (res) {
					res.send('server error', 500);
				}
				if (callback) {
					callback(err);
				}
				return;
			}

	    	var newCollectionId = collection.get('_id');
	    	console.success('* saved PointCollection "'+collection.get('title')+'" = '+newCollectionId);

			var job = new models.Job({status: config.JobStatus.ACTIVE, type: config.JobType.IMPORT});
			job.save(function(err, job) {
				if (err) {
					console.error(err.message);
					if (res) {
						res.send('server error', 500);
					}
					if (callback) {
						callback(err);
					}
					return;
				}

		    	console.success('*** job started ***');

				var response = {
					'pointCollectionId': newCollectionId,
				};
			
				if (res) {
					res.send(response);
				}

				var maxVal, 
					minVal, 
					maxIncField,
					numRead = 0,
					numImport = 0,
					numSaving = 0,
					numSaved = 0,
					numSkipped = 0,
					ended = false,
					finalized = false,
					paused = false;

				var finalize = function(parserErr) {
					finalized = true;
					if (maxVal != undefined) {
				    	collection.maxVal = collection.maxVal ? Math.max(maxVal, collection.maxVal) : maxVal;
					}
					if (minVal != undefined) {
						collection.minVal = collection.minVal ? Math.min(minVal, collection.minVal) : minVal;
					}
					if (maxIncField != undefined) {
						if (!collection.maxIncField || collection.maxIncField < maxIncField) {
							collection.maxIncField = maxIncField;
						}
					}
 					collection.cropDistribution = collection.minVal / collection.maxVal > config.MIN_CROP_DISTRIBUTION_RATIO;
					collection.active = true;
					collection.numBusy = 0;
					collection.reduce = collection.reduce || numSaved > 1000;
					collection.status = !params.append ? config.DataStatus.UNREDUCED : config.DataStatus.UNREDUCED_INC;
					collection.save(function(err) {
						if (err) {
							console.error(err.message);
							if (callback) {
								callback(err);
							}
							return;
						}
				    	debugStats('*** finalized and activated collection ***', 'success');
						job.status = config.JobStatus.IDLE;
						job.save(function(err) {
							if (err) {
								console.error(err.message);
								if (callback) {
									callback(err);
								}
								return;
							}
							if (!parserErr) {
						    	debugStats('*** job completed ***', 'success', null, true);
							} else {
						    	debugStats('*** job failed ***', 'error', null, true);
							}
							if (callback) {
								callback(false);
							}
						});
					});
				};

				var debugStats = function(pos, func, info, force) 
				{
					if (!func) {
						func = 'log';
					}
					if (force || (func == 'warn' || func == 'error') || (pos == 'on save' && numSaved > 0 && numSaved % 1000 == 0) || (pos == 'on data' && numRead % 1000 == 0)) {
						console[func].apply(console, ['* '+collection.get('_id')+' '+pos, (info ? info : ''), '-- stats: numRead: ' + numRead + ', numSaving: '+numSaving + ', numSaved: '+numSaved+(headerValues.totalCount ? ' of '+headerValues.totalCount : '')+', numSkipped: '+numSkipped]);
					}
				};

				function postSave(self) 
				{
					if (numSaving == 0) {
						if (ended) {
							if (!finalized) {
								finalize();
							}
							return;
						}

				    	if (self.readStream && paused) {
					    	debugStats('resume');
					    	self.readStream.resume();
					    	paused = false;
					    }
					}
				}

				function makeSaveHandler(point, self) 
				{
					return function(err, point) {
						if (err) console.error(err.message);
				    	debugStats('on save', 'success', (point ? point.get('_id') : ''));
						point = null;
						numSaving--;
						numSaved++;
				    	postSave(self);
					}
				}

				function onHeader(header)
				{
					headerValues = header;
					for (k in allowedHeaderValues) {
						if (header[k]) {
							console.log('* header ', k, header[k]);
							collection[k] = header[k];
						}
					}
					if (header.totalCount) {
						collection.numBusy = header.totalCount;
					}
				} 

				function onData(data, index) 
				{
					if (ended) return;
					numRead++;
			    	debugStats('on data', 'info');
			    	var self = this;

					if (FIRST_ROW_IS_HEADER && !fieldNames) {
						fieldNames = data;
				    	debugStats('using row as header');
					} else {
						numImport++;
						if (numImport <= params.skip || numImport % params.interval != 0) {
					    	debugStats('skipping row');
					    	numSkipped++;
					    	return;
						}
						if (params.max && numImport - params.skip > params.max) {
					    	debugStats('reached limit, ending', 'success', null, true);
							ended = true;
							self.end();
							return;
						}

						if (FIRST_ROW_IS_HEADER) {
							var doc = {};
							for (var i = 0; i < fieldNames.length; i++) {
								doc[fieldNames[i]] = data[i];
							}
						} else {
							doc = data;
						}

						if (doc.id) {
							doc.sourceId = doc.id;
						}

						var model = new Model(doc);
						var point = conversion.convertModel(model, converter, Point);
						point.importJob = job;
						var loc = point ? point.get('loc') : null;
						var doSave = point 
							&& (!params.bounds || (loc[0] >= params.bounds[0][0] && loc[1] >= params.bounds[0][1] && loc[0] <= params.bounds[1][0] && loc[1] <= params.bounds[1][1]))
							&& (!params.from || point.get('datetime') >= params.from)
							&& (!params.to || point.get('datetime') <= params.to)
							&& (!params.incremental || collection.get('maxIncField') == undefined || !point.get('incField') || point.get('incField') > collection.get('maxIncField'));

						if (doSave) {
					    	if (self.readStream) {
						    	self.readStream.pause();
						    	paused = true;
					    	}
							point.pointCollection = collection;
							point.created = new Date();
							point.modified = new Date();
							if (maxVal == undefined || maxVal < point.get('val')) {
								maxVal = point.get('val');
							}
							if (minVal == undefined || minVal > point.get('val')) {
								minVal = point.get('val');
							}
							if (maxIncField == undefined || maxIncField < point.get('incField')) {
								maxIncField = point.get('incField');
							}
							numSaving++;
							importCount++;

							var saveHandler = makeSaveHandler(point, self);
							point.save(saveHandler);
						} else {
							if (point && params.break) {
						    	debugStats('reached break point, ending', 'success', null, true);
								ended = true;
								self.end();
								return;
							} else {
								debugStats('* skipping point' + (model && model.get('sourceId') ? ' [sourceId=' + model.get('sourceId') + ']' : ''));
								numSkipped++;
						    	postSave(self);
							}
						}

						if (numRead == 1 || numRead % 5000 == 0) {
					    	if (global.gc) {
						    	// https://github.com/joyent/node/issues/2175
						    	process.nextTick(function () {
						    		var mem1 = process.memoryUsage();
							    	debugStats('force garbage collection');
									global.gc(true);
									var mem2 = process.memoryUsage();
							    	debugStats('memory usage: before ' + 
							    		Math.round(mem1.rss / 1048576) + 'MiB, after: ' +
							    		Math.round(mem2.rss / 1048576) + 'MiB, freed: ' +
							    		Math.round((1 - mem2.rss / mem1.rss) * 100) + '%');
								});
					    	}

					    	debugStats('update progress', 'info', (collection.numBusy ? Math.round(collection.progress / collection.numBusy * 100)+'%' : ''));
					    	collection.progress = numSaved;
					    	collection.save();
						}
					}
			    }

			    function onEnd(count) 
			    {
			    	ended = true;
			    	debugStats('on end');
					if (numSaving == 0 && !finalized) {
						finalize();
					}
			    }

			    function onError(err) 
			    {
			        console.error(err.message);
			        finalize(err);
			    }

			    var format = require('./formats/' + params.format + '.js');
			    var parser = format.Parser();

				parser.on('header', onHeader)								
					.on('data', onData)								
				    .on('end', onEnd)
				    .on('error', onError);

				var formatSource = function(str, pointCollection) {
					if (params.incremental && pointCollection.maxIncField instanceof Date) {
						return pointCollection.maxIncField.format(str);
					}
					return str;
				};

				if (params.stream) {
					console.info('*** Importing from stream ***', params.stream, '[converter=' + params.converter + ']');
					parser.fromStream(params.stream);
				} else if (params.url) {
					var url = formatSource(params.url, collection);
					console.info('*** Importing from URL ***', url, '[converter=' + params.converter + ']');
					parser.fromStream(format.Request({url: url}));
				} else {
					var path = formatSource(params.path, collection);
					console.info('*** Importing from path ***', path, '[converter=' + params.converter + ']');
					parser.fromPath(path);
				}
			});
		});
	};

	var converterInit = converter.init || function(callback) {
		callback();
	};
	converterInit(function() {
		if (!params.append) {
			console.info('*** Creating new collection ***');
			var defaults = new LayerOptions(config.COLLECTION_DEFAULTS);
			for (var key in config.COLLECTION_DEFAULTS) {
				if (params[key]) {
					defaults[key] = params[key];
				}
			}
			defaults.save(function(err, res) {
				if (err) {
					console.error(err.message);
					if (res) {
						res.send('server error', 500);
						if (callback) {
							callback(err);
						}
					}
					return;
				}
				runImport(new PointCollection({
					defaults: defaults._id,
					title: params.title || path.basename(params.url || params.path),
					description: params.description,
					unit: "",
					progress: 0,
				}));
			});

		} else {
			console.info('*** Appending to collection ***', params.append);
			PointCollection.findOne({_id: params.append}, function(err, collection) {
				if (!self.validateExistingCollection(err, collection, callback)) return;
				runImport(collection);
			});
		}
	});
}

ImportAPI.prototype.sync = function(params, req, res, callback) 
{
	var self = this;
	var pointCollectionId = params.append;
	console.info('*** Synchronizing collection ***', pointCollectionId);
	PointCollection.findOne({_id: pointCollectionId}, function(err, collection) {
		if (!self.validateExistingCollection(err, collection, callback)) return;
		var originalParams = collection.get('importParams');
		if (params.url || params.path) {
			delete originalParams.url;
			delete originalParams.path;
		}
		var importParams = _.cloneextend(originalParams, params);
		importParams.incremental = true;
		self.import(importParams, req, res, callback);
	});

}

function getImportParams(params) 
{
	return utils.deleteUndefined({
		url: params.u || params.url,
		path: params.p || params.path,
		format: params.f || params.format,
		converter: params.c || params.converter,
		append: params.append,
		from: params.from,
		to: params.to,
		max: params.max,
		skip: params.skip,
		incremental: params.incremental,
		break: params.break, 
		interval: params.interval,
		bounds: params.bounds
	});
}

ImportAPI.prototype.cli = {
	
	import: function(params, callback, showHelp) 
	{
		var help = "Usage: node manage.js import [import-params]\n"
			+ "\nImports records from a URL or a file into a new point collection.\n";

		if (!showHelp && utils.connectDB()) {
			params.append = params._[1];
			this.import(getImportParams(params), null, null, callback);
		} else {
			callback(false, help);
		}
	},
	
	sync: function(params, callback, showHelp) 
	{
		var help = "Usage: node manage.js sync <object-id> [import-params]\n"
			+ "\nSynchronizes a point collection using the same import parameters "
			+ "\nthat were used when last importing records into the collection."
			+ "\nYou can override all arguments when syncing, for instance to import "
			+ "\nrecords from a different data source into the same collection.\n";
		if (!showHelp && params._.length > 1 && utils.connectDB()) {
			params.append = params._[1];
			this.sync(getImportParams(params), null, null, callback);
		} else {
			callback(false, help);
		}
	},

	'list-collections': function(params, callback, showHelp) 
	{
		if (utils.connectDB()) {
			console.log('Existing collections:');
			PointCollection.find({}).run(function(err, docs) {
				if (!err) {
					docs.forEach(function(doc) {
						console.log('  *', doc._id, doc.title);
					});
				}
				callback(err);
			});
		}
	}



}


module.exports = ImportAPI;