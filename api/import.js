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
		console.error(err.message);
		if (callback) {
			callback(err);
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
	if (params.from) {
		params.from = new Date(params.from);
	}
	if (params.to) {
		params.to = new Date(params.to);
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

				var maxVal, minVal, maxIncField;
				var numRead = 0;
				var numImport = 0;
				var numSaving = 0;
				var numDone = 0;
				var ended = false;
				var finalized = false;
				var paused = false;

				var finalize = function() {
					finalized = true;
					if (maxVal != undefined) {
				    	collection.maxVal = collection.maxVal ? Math.max(maxVal, collection.maxVal) : maxVal;
					}
					if (minVal != undefined) {
						collection.minVal = collection.minVal ? Math.min(minVal, collection.minVal) : minVal;
					}
					if (maxIncField != undefined) {
						collection.maxIncField = collection.maxIncField ? Math.max(maxIncField, collection.maxIncField) : maxIncField;
					}
 					collection.cropDistribution = collection.minVal / collection.maxVal > config.MIN_CROP_DISTRIBUTION_RATIO;
					collection.active = true;
					collection.numBusy = 0;
					collection.reduce = numDone > 1000;
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
					    	debugStats('*** job completed ***', 'success');
							if (callback) {
								callback(false);
							}
						});
					});
				};

				var debugStats = function(pos, func, info) 
				{
					if (!func) {
						func = 'log';
					}
					if ((pos != 'on data' && pos != 'on save') || (pos == 'on save' && numDone > 0 && numDone % 1000 == 0) || (pos == 'on data' && numRead % 1000 == 0)) {
						console[func].apply(console, ['* '+collection.get('_id')+' '+pos, (info ? info : ''), '-- stats: numRead: ' + numRead + ', numSaving: '+numSaving + ', numDone: '+numDone+(headerValues.totalCount ? ' of '+headerValues.totalCount : '')]);
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
						numDone++;
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
						if (numImport <= params.skip) {
					    	debugStats('skipping row');
					    	return;
						}
						if (params.max && numImport - params.skip > params.max) {
					    	debugStats('reached limit, ending');
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

						var doSave = point 
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
							debugStats('* skipping point' + (model && model.get('sourceId') ? ' [sourceId=' + model.get('sourceId') + ']' : ''), 'warn');
					    	postSave(self);
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
					    	collection.progress = numDone;
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

			    function onError(error) 
			    {
			        console.error(error.message);
			    }

			    var format = require('./formats/' + params.format + '.js');
			    var parser = format.Parser();

				parser.on('header', onHeader)								
					.on('data', onData)								
				    .on('end', onEnd)
				    .on('error', onError);

				if (params.stream) {
					console.info('*** Importing from stream ***', params.stream, '[converter=' + params.converter + ']');
					parser.fromStream(params.stream);
				} else if (params.url) {
					console.info('*** Importing from URL ***', params.url, '[converter=' + params.converter + ']');
					parser.fromStream(format.Request({url: params.url}));
				} else {
					console.info('*** Importing from path ***', params.path, '[converter=' + params.converter + ']');
					parser.fromPath(params.path);
				}
			});
		});
	};

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
}

ImportAPI.prototype.sync = function(params, req, res, callback) 
{
	var self = this;
	var pointCollectionId = params.pointCollectionId;
	console.info('*** Sychronizing collection ***', pointCollectionId);
	PointCollection.findOne({_id: params.pointCollectionId}, function(err, collection) {
		if (!self.validateExistingCollection(err, collection, callback)) return;
		var importParams = _.cloneextend(collection.get('importParams'), params);
		importParams.incremental = true;
		importParams.append = pointCollectionId;
		self.import(importParams, req, res, callback);
	});

}


module.exports = ImportAPI;