// TODO: runImport should not handle req and res

var config = require('../../config'),
	models = require("../../models"),
	permissions = require("../../permissions"),
	utils = require("../../utils"),
	errors = require('../../errors'),
	BasicError = errors.BasicError,
	ValidationError = errors.ValidationError,
	conversion = require("./conversion"),
  	mongoose = require('mongoose'),
	date = require('datejs'),
	url = require('url'),
	_ = require('cloneextend'),
	path = require('path'),
	console = require('../../ext-console.js'),
	MapReduceAPI = require('../mapreduce');

var LayerOptions = models.LayerOptions,
	handleDbOp = utils.handleDbOp,
	PseudoModel = function(doc) {
		for (var k in doc) {
			this[k] = doc[k];
		}
		this.get = function(key) {
			return doc[key];
		}
		this.toObject = function() {
			return doc;
		}
	};

var ImportAPI = function(app) {
	var self = this;
	if (app) {
		app.post('/api/import/', function(req, res) {
			if (!permissions.canImportData(req)) {
	            res.send('import not allowed', 403);
	            return;
			}
			var params = {};

			var numberOrNull = function(val) {
				var n = Number(val);
				if (isNaN(n)) return null;
				return n;
			}

			params.dry = req.body.preview || req.body.inspect;
			params.max = numberOrNull(req.body.max);
			if (!req.body.background) {
				if (!params.max || params.max < 0) {
					params.max = 1000;
				} else {
					params.max = Math.min(1000, params.max);
				}
			}

			// prevent arbitrary script inclusion
			if (req.body.converter) {
				// TODO: check if exists
				params.converter = path.basename('' + req.body.converter);				
			}
			if (req.body.format) {
				params.format = path.basename('' + req.body.format);				
			}
			// prevent arbitrary file import
			req.body.path = null;

			var errors = {},
				valid = true,
				converter;

			if (!req.body.url) {
				valid = false;
				errors.url = {
					message: 'URL is missing'
				};
			} else {
				params.url = req.body.url;
			}

			if (!req.body.inspect) {
				converter = conversion.PointConverterFactory(req.body.fields, {
					strict: !params.dry
				});

				if (!converter) {
					valid = false;
					errors['fields'] = {
						message: 'No fields specified'
					};
				} else if (converter.name =='ValidationError') {
					valid = false;
					errors = _.cloneextend(errors, converter.errors);
				} else {
					// TODO: pass in converter directly
					params.fields = req.body.fields;
				}
			} else {
				params.converter = false;
			}

			if (req.body.mapreduce == null || req.body.mapreduce) {
				params.mapreduce = !params.dry;
			}

			if (!valid) {
				var err = new ValidationError(null, errors);
				console.error(err);
	            res.send(err, 403);
			} else {
				var sendItems = req.body.preview || req.body.inspect ? [] : null;
				self.import(params, req, res, function(err, collection) {
					if (err) {
						res.send(new BasicError(err.message), 403);
						console.error(err);
						return;
					}
					var err = false;
					console.success('*** import request completed');
					if (!req.body.background) {
						res.send({
							collection: collection,
							items: sendItems
						});
					}
				}, {
					save: function(err, obj) {
						//console.log('****', 'save', obj);
					},
					data: function(err, result) {
						if (req.body.inspect) {
							sendItems.push(result.toObject());
						}
					},
					convert: function(err, result) {
						if (req.body.preview) {
							sendItems.push(result.converted);
						}
					},
					start: function(err, collection) {
						if (req.body.background) {
							console.success('import request started, performing in background and responding immediately');
							res.send({
								collection: collection,
							});
						}
					}
				});
			}
		});
	}
}

var REGEX_IS_REGULAR_MODULE = /^[a-z][a-z0-9_\/\.]*$/;

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
ImportAPI.prototype.import = function(params, req, res, callback, dataCallbacks)
{
	var self = this;
		params = params || {},
		dataCallbacks = dataCallbacks || {};

	var defaults = {
		url: null, path: null, stream: null,
		format: null,
		max: 0,
		interval: 1,
		skip: 0,
		incremental: false
	};

	var allowedHeaderValues = {
		gridSize: null
	};

	var params = _.cloneextend(defaults, params);

	if (!params.format) {
		if (params.path) {
			params.format = params.path.split('.').pop();
		} else if (params.url) {
			params.format = params.url.split('.').pop();
		}
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
	var Converter, converterModule, converter, 
		formatModule, Format, parser;

	if (!params.fields && params.converter) {
		if (typeof params.converter == 'object') {
			converter = params.converter;
		} else if (typeof params.converter == 'string') {
			if (params.converter.match(REGEX_IS_REGULAR_MODULE)) {
				converterModule = './conversion/' + params.converter;
			} else {
				converterModule = params.converter;
			}
			console.log('Loading converter: '+params.converter);
			try {
				Converter = require(converterModule);
			} catch(err) {
				if (callback) {
					if (err.code == 'MODULE_NOT_FOUND') {
						err = new Error('Unknown converter: ' + params.converter);
					}
					callback(err);
					return;
				}
				throw err;
			}
		}
	} else {
		Converter = function(fieldDefs) {
			return conversion.PointConverterFactory(fieldDefs);
		}
	}

	if (params.format.match(REGEX_IS_REGULAR_MODULE)) {
		formatModule = './formats/' + params.format;
	} else {
		formatModule = params.format;
	}
	console.log('Loading format: '+params.format);
	try {
		format = require(formatModule);
	} catch(err) {
		if (callback) {
			if (err.code == 'MODULE_NOT_FOUND') {
				err = new Error('Unknown format: ' + params.format);
			}
			callback(err);
			return;
		}
		throw err;
	}

	if (!format.Parser) {
		var err = new Error('format module does not export `Parser`');
		if (callback) {
			callback(err);
			return;
		}
		throw err;
	}
    parser = format.Parser();

	var importCount = 0;
	var fieldNames;
	var FIRST_ROW_IS_HEADER = params.format == 'csv';

	var runImport = function(collection) 
	{
		var sendItems;
		if (!converter) {
			var fields = params.fields ?
				params.fields : collection.importParams && collection.importParams.fields ? 
				collection.importParams.fields : null;
			if (fields) {
				converter = Converter(fields);
			} else {
				converter = Converter({
					'geometry.coordinates': {
						'type': 'LngLat',
						'fromFields': ['loc']
					},
					'properties.val': {
						'type': 'Number',
						'fromFields': ['val']
					}
				});
			}
			if (!converter.convertModel) {
				var err = new Error('converter module does not export `convertModel`');
				if (callback) {
					callback(err);
					return;
				}
				throw err;
			}
			if (!converter) {
				var err = new Error('could not create converter');
				if (callback) {
					callback(err);
					return;
				}
				throw err;
			}
		}

		var headerValues = {};
		
		if (!params.append) {
			collection.active = false;
			collection.status = config.DataStatus.IMPORTING;
		} else {
			collection.status = config.DataStatus.IMPORTING_INC;
		}

		// TODO: can't save import params with keys that contain dots -- use Array instead
		/*if (!params.dry && (params.saveParams == undefined || params.saveParams)) {
			collection.importParams = _.cloneextend(utils.deleteUndefined(params), {
				fields: converter.fieldDefs
			});
		}*/
		if (req && req.session) {
			collection.createdBy = collection.modifiedBy = req.session.user;
		}

		var collectionSave = !params.dry ?
			collection.save : function(callback) { callback(false, collection) };

		collectionSave.call(collection, function(err, collection) {
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
	    	if (!params.dry) {
		    	console.success('*** running import for '+collection._id+' "'+collection.get('title'));
	    	} else {
		    	console.warn('*** dry run: data will not be saved');
	    	}

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

				if (dataCallbacks.start) {
					dataCallbacks.start(false, collection);
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
					finalized = false;

				var finalize = function(parserErr) 
				{
					ended = true;
					finalized = true;
					if (maxVal != undefined) {
				    	collection.maxVal = collection.maxVal ? Math.max(maxVal, collection.maxVal) : maxVal;
					}
					if (minVal != undefined) {
						collection.minVal = collection.minVal ? Math.min(minVal, collection.minVal) : minVal;
					}
			    	collection.isNumeric = !isNaN(collection.maxVal) && !isNaN(collection.minVal);
					if (!collection.isNumeric) {
						collection.defaults.histogram = false;
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

					var collectionSave = !params.dry ?
						collection.save : function(callback) { callback(false, collection) };

					collectionSave.call(collection, function(err) {
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
							if (parserErr) {
						    	debugStats('*** job failed ***', 'error', null, true);
								if (callback) {
									callback(parserErr, collection);
								}
							} else {
						    	debugStats('*** job completed ***', 'success', null, true);
								if (params.mapreduce) {
									console.log('**** starting mapreduce');
									var mapReduceParams = {
										pointCollectionId: collection._id.toString()
									};
									new MapReduceAPI().mapReduce(mapReduceParams, req, res, callback);
								} else {
									if (callback) {
										callback(false, collection);
									}
								}
							}
						});
					});
				};

				var debugStats = function(pos, func, info, force) 
				{
					if (!func) {
						func = 'log';
					}
					if ((force /*|| config.DEBUG*/) || (func == 'warn' || func == 'error') || (pos == 'on save' && numSaved > 0 && numSaved % 1000 == 0) || (pos == 'on data' && numRead % 1000 == 0)) {
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

				    	if (self.readStream) {
					    	debugStats('resume');
					    	self.readStream.resume();
					    }
					}
				}

				function makeSaveHandler(point, converted, self) 
				{
					return function(err, result) {
						if (err) {
							console.error('Error saving point', err);
						}
				    	debugStats('on save', 'success', (point ? point.get('_id') : ''));
						numSaving--;
						numSaved++;
				    	postSave(self);

				    	if (dataCallbacks.save) {
							dataCallbacks.save(err, result);
				    	}
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
			    	var self = this;
					if (ended) return;

					if (parser.readStream && parser.readStream.response && parser.readStream.response.statusCode != 200) {
						var err = new errors.HTTPError(null, parser.readStream.response.statusCode);
						console.error('* HTTP error', err);
						finalize(err);
						if (dataCallbacks.error) {
							dataCallbacks.error(err);
						}
						return;
					}

					numRead++;
			    	debugStats('on data', 'info');

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

						var model = new PseudoModel(doc),
							doSave = false,
							point;

						if (dataCallbacks.data) {
							dataCallbacks.data(false, model);
						}

						if (converter) {
							var conversionResult = converter.convertModel(model, ToModel, config);
							point = conversionResult.model;

							var loc = point ? point.get('loc') : null;
							doSave = point 
								&& (!params.bounds || (loc[0] >= params.bounds[0][0] && loc[1] >= params.bounds[0][1] && loc[0] <= params.bounds[1][0] && loc[1] <= params.bounds[1][1]))
								&& (!params.from || point.get('datetime') >= params.from)
								&& (!params.to || point.get('datetime') <= params.to)
								&& (!params.incremental || collection.get('maxIncField') == undefined || !point.get('incField') || point.get('incField') > collection.get('maxIncField'));
	
							if (dataCallbacks.convert) {
								dataCallbacks.convert(false, conversionResult);
							}
						}

						if (doSave) {
					    	if (self.readStream) {
					    		// unless paused, incoming data will pile up since saving
					    		// is slow. pausing the readStream until all are saved keeps 
					    		// memory consumption low.
						    	self.readStream.pause();
					    	}
							point.importJob = job;
							point.set(toCollectionField, collection);
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

							var saveHandler = makeSaveHandler(point, conversionResult.converted, self);
							if (!params.dry) {
								point.save(saveHandler);
							} else {
								saveHandler(false, point);
							}
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
					    	debugStats('update progress', 'info', (collection.numBusy ? Math.round(collection.progress / collection.numBusy * 100)+'%' : ''));
					    	collection.progress = numSaved;
					    	if (!params.dry) {
						    	collection.save();
					    	}
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
			    	console.error(err);
			    	if (err.code == 'ENOTFOUND') {
			    		// wrap network error in friendlyer error
			    		err = new errors.HTTPError(null, 404);
			    	}
			    	console.error(err);
			        finalize(err);
					if (dataCallbacks.error) {
						dataCallbacks.error(err);
					}
			    }

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
					try {
						parser.fromStream(format.Request({url: url}));
					} catch(err) {
						console.error(err);
						if (callback) {
							callback(err);
							return;
						}
						throw err;
					}
				} else {
					var path = formatSource(params.path, collection);
					console.info('*** Importing from path ***', path, '[converter=' + params.converter + ']');
					parser.fromPath(path);
				}
			});
		});
	};

	var ToModel = models.GeoFeature,
		ToCollectionModel = models.GeoFeatureCollection,
		toCollectionField = 'featureCollection';

	if (!params.append) {
		if (!params.dry) {
			console.info('*** Creating new collection ***');
		}
		var defaults = new LayerOptions(config.COLLECTION_DEFAULTS);
		for (var key in config.COLLECTION_DEFAULTS) {
			if (params[key]) {
				defaults[key] = params[key];
			}
		}
		var defaultsSave = !params.dry ?
			defaults.save : function(callback) { callback(false, defaults) };
		defaultsSave.call(defaults, function(err, defaults) {
			if (err) {
				console.error(err.message);
				if (callback) {
					callback(err);
				}
				return;
			}
			var filename = params.url || params.path;
				titlefy = function(s) {
					var s = s.replace(/_/, ' ');
      				return s.substr(0, 1).toUpperCase() + s.substring(1);
    			};
			runImport(new ToCollectionModel({
				defaults: defaults._id,
				title: params.title || titlefy(path.basename(filename, path.extname(filename))),
				description: params.description,
				unit: "",
				progress: 0,
			}));
		});

	} else {
		console.info('*** Appending to collection ***', params.append);
		ToCollectionModel.findOne({_id: params.append}, function(err, collection) {
			if (!utils.validateExistingCollection(err, collection, callback)) return;
			runImport(collection);
		});
	}
}

ImportAPI.prototype.sync = function(params, req, res, callback) 
{
	var self = this;
	if (!params) {
		params = {};
	}
	var pointCollectionId = params.append;
	console.info('*** Synchronizing collection ***', pointCollectionId);
	models.PointCollection.findOne({_id: pointCollectionId}, function(err, collection) {
		if (!utils.validateExistingCollection(err, collection, callback)) return;
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

ImportAPI.prototype.syncAll = function(params, req, res, callback)
{
	var self = this;
	if (!params) {
		params = {};
	}
	models.PointCollection.find({sync: true, status: config.DataStatus.COMPLETE}, function(err, collections) {
		console.info('*** Collections to sync: ' + collections.length);
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
				params.append = collection._id.toString();
				params.saveParams = false;
				console.warn('*** params will not be saved since multiple collections are synced')
				self.sync(params, req, res, dequeuePointCollection);
			}
		}
		dequeuePointCollection();
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
		incremental: (params.incremental ? params.incremental && params.incremental != 'off' : undefined),
		break: (params.break ? params.break && params.break != 'off' : undefined), 
		interval: params.interval,
		bounds: params.bounds,
		mapreduce: (params.mapreduce ? params.mapreduce && params.mapreduce != 'off' : undefined),
		fields: (params.fields ? JSON.parse(params.fields) : undefined) // precedence over converter
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
		if (!showHelp && utils.connectDB()) {
			if (params._.length > 1) {
				params.append = params._[1];
				this.sync(getImportParams(params), null, null, callback);
			} else {
				this.syncAll(getImportParams(params), null, null, callback);
			}
		} else {
			callback(false, help);
		}
	},

	'list-collections': function(params, callback, showHelp) 
	{
		if (utils.connectDB()) {
			models.PointCollection.find({}).exec(function(err, docs) {
				if (!err) {
					console.success('Existing collections:', docs.length);
					docs.forEach(function(doc) {
						var dump = {_id: doc._id, title: doc.title, status: doc.status};
						console.log('*', dump);
					});
				}
				callback(err);
			});
		}
	}
}


module.exports = ImportAPI;