// TODO: runImport should not handle req and res

var config = require('../../config'),
	models = require("../../models"),
	coordinates = require("../../geogoose").coordinates,
	permissions = require("../../permissions"),
	utils = require("../../utils"),
	findExtremes = require('../aggregate/mapreduce_abstraction/util').findExtremes,
	errors = require('../../errors'),
	BasicError = errors.BasicError,
	ValidationError = errors.ValidationError,
	transform = require("./data_transform"),
	getAttr = transform.util.getAttr,

	fs = require('fs'),
  	mongoose = require('mongoose'),
	url = require('url'),
	_ = require('cloneextend'),
	path = require('path'),
	console = require('../../ext-console.js'),
	AggregateAPI = require('../aggregate'),
	scopeFunctions = require('../aggregate/mapreduce_abstraction').scopeFunctions;

var LayerOptions = models.LayerOptions,
	handleDbOp = utils.handleDbOp;

var ImportAPI = function(app) 
{
	var self = this;
	if (app) {
		app.post('/api/import/', function(req, res) {
			// TODO: hack because cloneextend sometimes throws error
			// http://stackoverflow.com/questions/16585209/node-js-object-object-has-no-method-hasownproperty			
			req.body = JSON.parse(JSON.stringify(req.body));

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
			if (req.body.transform) {
				params.transform = (typeof req.body.transform != 'object') ? 
					path.basename('' + req.body.transform) : req.body.transform;
			}
			if (req.body.format) {
				params.format = path.basename('' + req.body.format);				
			}

			// prevent arbitrary file import
			req.body.path = null;

			var validationErrs = {},
				valid = true;

			if (!req.body.url) {
				valid = false;
				validationErrs.url = {
					message: 'URL is missing'
				};
			} else {
				params.url = req.body.url;
			}

			if (req.body.aggregate == null || req.body.aggregate) {
				params.aggregate = !params.dry;
			}

			if (!valid) {
				var err = new ValidationError(null, validationErrs);
				console.error(err);
	            res.send(err, 403);
			} else {
				var sendItems = req.body.preview || req.body.inspect ? [] : null,
					descripts, autoTransform;
				self.import(params, req, res, function(err, collection) {
					var err = err;
					if (err && !err.statusCode) {
						// mask error with friendlier message
						err = new BasicError('This file type could not be imported.');
					}
					if (!err && (sendItems && !sendItems.length)) {
						err = new errors.BasicError('Found no items to be imported.');
					}
					if (err) {
						res.send(new BasicError(err.message), err.statusCode || 403);
						console.error(err);
						return;
					}
					var err = false;
					console.success('*** import request completed');
					if (!req.body.background) {
						res.send({
							collection: collection,
							autoTransform: autoTransform,
							descripts: descripts,
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
					transform: function(err, model, transformed) {
						autoTransform = transformed.type == 'Feature';
						if (req.body.preview) {
							var expanded = {};
							for (var k in transformed) {
								scopeFunctions.setAttr(expanded, k, transformed[k]);
							}
							sendItems.push(expanded);
						}
					},
					start: function(err, collection, dataTransform) {
						if (req.body.background) {
							console.success('import request started, performing in background and responding immediately');
							res.send({
								collection: collection,
							});
						}
						descripts = dataTransform.descripts;
					},
				});
			}
		});
	}
}

var REGEX_IS_REGULAR_MODULE = /^[a-z][a-z0-9_\/\.]*$/;

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

	var formatModule, format, parser, dataTransform;

	if (params.format.match(REGEX_IS_REGULAR_MODULE)) {
		formatModule = './formats/' + params.format;
	} else {
		formatModule = params.format;
	}
	console.log('*** Loading format: '+params.format, formatModule);
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

    dataTransform = new transform.DataTransform(format.transform, {strict: !params.dry});
    dataTransform.verbose = config.DEBUG && config.VERBOSE;
	var customTransform;
    if (params.transform) {
    	if (typeof params.transform != 'object') {
			var transformModule = params.transform;
			console.log('* Loading transform: '+params.transform);
			try {
				customTransform = require(transformModule);
			} catch(err) {
				if (callback) {
					if (err.code == 'MODULE_NOT_FOUND') {
						err = new Error('Unknown transform: ' + params.transform);
					}
					callback(err);
					return;
				}
				throw err;
			}
    	} else {
    		customTransform = params.transform;
    	}
    	console.log('* custom transform', customTransform);
    	try {
    		var customTransform = new transform.DataTransform(customTransform);
    	} catch (err) {
			if (callback) {
				callback(err);
				return;
			}
			throw err;
    	}
    	dataTransform.addFields(customTransform.descripts);
    }

    if (params.layerOptions) {
    	if (typeof params.layerOptions != 'object') {
			console.log('* Loading layerOptions: '+params.layerOptions);
    		params.layerOptions = JSON.parse(fs.readFileSync(params.layerOptions));
	    	console.log('* layerOptions:', params.layerOptions);
    	}
    }

	var importCount = 0,
		fieldNames,
		FIRST_ROW_IS_HEADER = params.format == 'csv';

	var runImport = function(collection) 
	{
		var sendItems,
			ToSaveModel = collection.getFeatureModel(),
			headerValues = {};
		
		if (!params.append) {
			collection.active = false;
			collection.status = config.DataStatus.IMPORTING;
		} else {
			collection.status = config.DataStatus.IMPORTING_INC;
		}

		if (!params.dry && (params.saveParams == undefined || params.saveParams)) {
			collection.importParams = _.cloneextend(params, {
				transform: customTransform ? customTransform.descripts : null
			});
		}

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
		    	console.success('*** running import for '+collection._id+' ('+collection.get('title')+')');
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
					dataCallbacks.start(false, collection, dataTransform);
				}			

				var extremes = _.clone(collection.extremes || {}),
					bounds = collection.bbox && collection.bbox.length ? coordinates.boundsFromBbox(collection.bbox) : null,
					propertyTypes = {},
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
					if (parserErr) {
				    	debugStats('*** finalized with error ***', 'warn', null, true);
						if (!params.dry && !params.append) {
							defaults.remove(function(err) {
								collection.remove(function(err) {
									utils.callbackOrThrow(parserErr, callback);
								});
							});
						} else {
							utils.callbackOrThrow(parserErr, callback);
						}
						return;
					}

					collection.extremes = extremes;
					collection.markModified('extremes');
					if (!defaults.attrMap || !defaults.attrMap.numeric) {
						collection.defaults.histogram = false;
					}

					collection.sourceFieldNames = fieldNames;
					collection.fields = _.cloneextend(dataTransform.fields);

					// for constant property field types, add them to collection.fields
					var transformFieldNames = dataTransform.fields.map(function(f) {
						return f.name;
					});
					for (var key in propertyTypes) {
						var t = propertyTypes[key],
							n = 'properties.' + key;
						if (t && transformFieldNames.indexOf(n) == -1) {
							collection.fields.push({
								type: t.substr(0, 1).toUpperCase() + t.substring(1),
								name: n,
								label: key
							});
						}
					}

					console.info('* Detected fields:', collection.fields.reduce(function(previousValue, currentValue) {
						return previousValue.concat(['`' + currentValue.name + '` (' + currentValue.type + ')']);
					}, []).join(', '));

					collection.active = true;
					collection.numBusy = 0;
					if (bounds) {
						collection.bbox = coordinates.bboxFromBounds(bounds);
					}
					if (numSaved >= config.MIN_FEATURES_TILE && !collection.tile) {
						collection.tile = config.TILE_DEFAULT;
						defaults.featureType = config.FeatureType.SQUARE_TILES;
					}
					if (collection.limitFeatures == undefined) {
						collection.limitFeatures = numSaved >= config.MIN_FEATURES_LIMIT;
					}

					collection.status = collection.tile ? 
						(!params.append ? config.DataStatus.UNREDUCED : config.DataStatus.UNREDUCED_INC) : config.DataStatus.COMPLETE;

					// determine default field mappings by finding first 
					// Number and Date field and collection.fields
					if (!params.append) {
						if (!defaults.attrMap) {
							defaults.attrMap = {};
						}
						var fieldNames = collection.fields.map(function(field) { return field.name });
						// check if default label fields exist and use first
						config.DEFAULT_LABEL_FIELDS.every(function(fieldName) {
							var f = 'properties.' + fieldName;
							if (fieldNames.indexOf(f) != -1) {
								defaults.attrMap.label = f;
								return false;
							}
							return true;
						});
						// otherwise use first String field
						if (!defaults.attrMap.label) {
							collection.fields.every(function(field) {
								if (field.type == 'String') {
									defaults.attrMap.label = field.name;
									return false;
								}
								return true;
							});
						}
						// use first Numeric field
						collection.fields.every(function(field) {
							if (field.type == 'Number' && getAttr(extremes, field.name)) {
								defaults.attrMap.numeric = field.name;
								return false;
							}
							return true;
						});
						// use first Date field
						collection.fields.every(function(field) {
							if (field.type == 'Date' && getAttr(extremes, field.name)) {
								defaults.attrMap.datetime = field.name;
								return false;
							}
							return true;
						});
					}

					var defaultsSave = !params.dry && !params.append ?
						defaults.save : function(callback) { callback(false, defaults) };
					defaultsSave.call(defaults, function(err, defaults) {
						if (err) {
							console.error(err.message);
							if (callback) {
								callback(err);
							}
							return;
						}

						var collectionSave = !params.dry ?
							collection.save : function(callback) { callback(false, collection); };

						collectionSave.call(collection, function(err, collection) {
							if (err) {
								console.error(err.message);
								if (callback) {
									callback(err);
								}
								return;
							}
						
							if (!params.dry) {
						    	debugStats('*** finalized and activated collection ***', 'success', null, true);
							} else {
						    	debugStats('*** finalized dry run ***', 'warn', null, true);
							}
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
									if (params.aggregate) {
										console.log('**** starting aggregate');
										var aggregateParams = {
											featureCollectionId: collection._id.toString()
										};
										new AggregateAPI().aggregate(aggregateParams, req, res, callback);
									} else {
										if (callback) {
											callback(false, collection);
										}
									}
								}
							});
						});
					});
				};

				var debugStats = function(pos, func, info, force) 
				{
					if (!func) {
						func = 'log';
					}
					if ((force /*|| config.DEBUG*/) || (func == 'warn' || func == 'error') || (pos == 'on save' && numSaved > 0 && numSaved % 1000 == 0) || (pos == 'on data' && numRead % 1000 == 0)) {
						console[func].apply(console, ['* '+collection.get('_id')+': '+pos, (info ? info : ''), '| numRead: ' + numRead + ' | numSaved: '+numSaved+(headerValues.totalCount ? '/'+headerValues.totalCount : '')+' | numSkipped: '+numSkipped + ' | numSaving: '+numSaving + ' |']);
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

				    	if (parser.readStream) {
					    	debugStats('resume');
					    	parser.readStream.resume();
					    }
					}
				}

				function makeSaveHandler(model, self) 
				{
					return function(err, result) {
						if (err) {
							console.error('Error saving model', err, model);
						} else {
							numSaved++;
							if (model.geometry.coordinates && model.geometry.coordinates.length) {
								bounds = coordinates.getBounds([model.getBounds(), bounds]);
							}
						}

				    	debugStats('on save', 'success', '');
						numSaving--;
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
					if (typeof data != 'object') return;

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
							if (!fieldNames) {
								fieldNames = Object.keys(data);
							}
							doc = data;
						}

						if (doc.id) {
							doc.sourceId = doc.id;
						}

						var doc = new transform.Document(doc);

						if (dataCallbacks.data) {
							dataCallbacks.data(false, doc);
						}

						dataTransform.transform(doc, ToSaveModel);

					}
			    }

			    function onTransformData(saveModel, transformed)
			    {
					if (dataCallbacks.transform) {
						dataCallbacks.transform(false, saveModel, transformed);
					}

					var doSave;

					if (saveModel) {
						var loc = saveModel.geometry.coordinates,
							datetime = saveModel.properties ? saveModel.properties.datetime : undefined,
							incrementor = saveModel.incrementor;

						doSave = saveModel
							&& (!loc || !loc.length || !params.bounds 
								|| (loc[0] >= params.bounds[0][0] && loc[1] >= params.bounds[0][1] && loc[0] <= params.bounds[1][0] && loc[1] <= params.bounds[1][1]))
							&& (!datetime || !params.from || datetime >= params.from)
							&& (!datetime || !params.to || datetime <= params.to)
							&& (!params.incremental || !collection.extremes || collection.extremes.incrementor == undefined 
								|| incrementor == undefined || incrementor > collection.extremes.incrementor.max);
					}

					if (doSave) {
				    	if (parser.readStream) {
				    		// unless paused, incoming data will pile up since saving
				    		// is slow. pausing the readStream until all are saved keeps 
				    		// memory consumption low.
					    	parser.readStream.pause();
				    	}
						saveModel.importJob = job;

						// determine extremes of all properties
						if (!extremes.properties) {
							extremes.properties = {};
						}
						for (var key in saveModel.properties) {
							// determine type for each property as long as it remains constant
							var propertyType = saveModel.properties[key] == null || saveModel.properties[key] == undefined ? null 
								: Array.isArray(saveModel.properties[key]) ? 'array'
								: typeof saveModel.properties[key];

							// String coercion: when detecting decimals or dates, cast and store them as these types
							// so that extremes are calculated correctly and they can actually be used for quantitative
							// or date comparison.
							if (propertyType == 'string') {
								// try to cast Number
								if (transform.Filter.isDecimal(saveModel.properties[key])) {
									propertyType = 'Number';
									saveModel.set('properties.' + key, transform.Cast.Number(saveModel.properties[key]));
									console.warn('Coercing ' + key + ' to Number');
								// try to cast Date
								} else if (transform.Filter.isValidDate(saveModel.properties[key], false)) {
									propertyType = 'Date';
									saveModel.set('properties.' + key, transform.Cast.Date(saveModel.properties[key]));
									console.warn('Coercing ' + key + ' to Date');
								}
							}

							if (propertyType) {
								// if this is the first time we encounter the property
								if (propertyTypes[key] == undefined) {
									propertyTypes[key] = propertyType;
								} else {

									// if the property type is inconsistent, set to false (except: 
									// if one was a Date and the other was a string, then reset to string,
									// since some random strings parse as Date)
									if (propertyTypes[key] != propertyType && !transform.Filter.isEmpty(saveModel.properties[key])) {
										
										if ((propertyType == 'string' && ['Number', 'Date'].indexOf(propertyTypes[key]) != -1)
											|| (propertyTypes[key] == 'string' && ['Number', 'Date'].indexOf(propertyType) != -1)) {
												propertyTypes[key] = 'string';										
										} else {
											propertyTypes[key] = false;										
										}
									}
								}
							}

							// determine extremes of property
							extremes.properties[key] = findExtremes(saveModel.properties[key], extremes.properties[key]);
						}
						// determine extremes of all incrementor
						if (incrementor) {
							extremes.incrementor = findExtremes(incrementor, extremes.incrementor);
						}

						numSaving++;
						importCount++;

						var saveHandler = makeSaveHandler(saveModel, self);
						//console.log('SAVE', saveModel);
						if (!params.dry) {
							saveModel.save(saveHandler);
						} else {
							saveHandler(false, saveModel);
						}
					} else {
						if (saveModel && params.break) {
					    	debugStats('reached break point, ending', 'success', null, true);
							ended = true;
							self.end();
							return;
						} else {
							debugStats('* skipping record');
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
			    	if (ended) return;

			    	if (dataCallbacks.error) {
			    		dataCallbacks.error(err);
			    	}

			    	if (err.code == 'ENOTFOUND') {
			    		// wrap network error in friendlyer error
			    		err = new errors.HTTPError(null, 404);
			    	}
			    	if (this.readStream && this.readStream.destroy) {
			    		console.warn('*** destroying readStream');
				    	parser.readStream.destroy();
			    	}

			    	console.error('Parser error during import, aborting...', err);
			        finalize(err);
			    }

				parser.on('header', onHeader)								
					.on('data', onData)								
				    .on('end', onEnd)
				    .on('error', onError);

				dataTransform.on('data', onTransformData);

				if (params.stream) {
					console.info('*** Importing from stream ***', params.stream, '[converter=' + params.converter + ']');
					parser.fromStream(params.stream);
				} else if (params.url) {
					var url = params.url;
					console.info('*** Importing from URL:', url, '[format=' + params.format + '] into ' + ToSaveModel.collection.name);
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
					var path = params.path;
					console.info('*** Importing from path:', path, '[format=' + params.format + '] into ' + ToSaveModel.collection.name);
					parser.fromPath(path);
				}
			});
		});
	};

	var ToSaveModel, // created on the fly when collection _id known
		ToCollectionModel = models.GeoFeatureCollection;

	if (!params.append) {
		if (!params.dry) {
			console.info('*** Creating new collection ***');
		}
		var defs = _.cloneextend(config.LAYER_OPTIONS_DEFAULTS, format.defaults || {});
		if (params.layerOptions) {
			defs = _.cloneextend(defs, params.layerOptions);
		}
		var defaults = new LayerOptions(defs);

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
			var filename = params.url || params.path,
				titlefy = function(s) {
					var s = unescape(s).replace(/_/g, ' ');
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
	models.GeoFeatureCollection.findOne({_id: pointCollectionId}, function(err, collection) {
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
	models.GeoFeatureCollection.find({sync: true, status: config.DataStatus.COMPLETE}, function(err, collections) {
		console.info('*** Collections to sync: ' + collections.length);
		if (err) {
			if (callback) {
				callback(err);
			}
		}
		var dequeueCollection = function(err) {
			if (err || !collections.length) {
				if (callback) {
					callback(err);
				}
			} else {
				var collection = collections.pop();
				params.append = collection._id.toString();
				params.saveParams = false;
				console.warn('*** params will not be saved since multiple collections are synced')
				self.sync(params, req, res, dequeueCollection);
			}
		}
		dequeueCollection();
	});
}

function getImportParams(params) 
{
	return utils.deleteUndefined({
		url: params.u || params.url,
		path: params.p || params.path,
		format: params.f || params.format,
		transform: params.t || params.transform, 
		layerOptions: params.layerOptions,
		append: params.append,
		from: params.from,
		to: params.to,
		max: params.max,
		skip: params.skip,
		dry: (params.dry ? params.dry && params.dry != 'off' : undefined),
		incremental: (params.incremental ? params.incremental && params.incremental != 'off' : undefined),
		break: (params.break ? params.break && params.break != 'off' : undefined), 
		interval: params.interval,
		bounds: params.bounds,
		aggregate: (params.aggregate ? params.aggregate && params.aggregate != 'off' : undefined),
		fields: (params.fields ? JSON.parse(params.fields) : undefined) // precedence over converter
	});
}

ImportAPI.prototype.cli = {
	
	import: function(params, callback, showHelp) 
	{
		var help = "Usage: node manage.js import [import-params]\n"
			+ "\nImports records from a URL or a file into a new point collection.\n";

		if (!showHelp && utils.connectDB()) {
			if (!params.append) {
				params.append = params._[1];
			}
			//console.log(params);
			this.import(getImportParams(params), null, null, callback);
		} else {
			callback(false, help, true);
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
			callback(false, help, true);
		}
	},

	'list-collections': function(params, callback, showHelp) 
	{
		if (utils.connectDB()) {
			models.GeoFeatureCollection.find({}).exec(function(err, docs) {
				if (!err) {
					console.success('Existing collections:', docs.length);
					docs.forEach(function(doc) {
						var dump = {_id: doc._id, title: doc.title, status: doc.status,
							createdAt: doc.createdAt, updatedAt: doc.updatedAt, lastReducedAt: doc.lastReducedAt};
						console.log('*', dump);
					});
				}
				callback(err);
			});
		}
	},

	'reset-collection': function(params, callback, showHelp) 
	{
		var help = "Usage: node manage.js reset-collection [params]\n"
			+ "\nResets the status for a collection that is left busy to 'Complete', for instance after an aggregation operation was forcefully cancelled.\n"

		if (!showHelp && utils.connectDB()) {
			if (params._.length) {
				params.featureCollectionId = params._[1];
			}
			models.GeoFeatureCollection.findOne({_id: params.featureCollectionId}).exec(function(err, collection) {
				if (!utils.validateExistingCollection(err, collection, callback, true)) return;
				if (!err && collection) {
					console.info('Existing collection:', params.featureCollectionId);
					models.GeoFeatureCollection.update({_id: params.featureCollectionId}, {$set: {status: 'C', progress: null}}, function(err, collection) {
						if (!err) {
							console.success('Collection reset:', params.featureCollectionId);
						}
						callback(err);
					});
					return;
				}
				callback(err);
			});
		}
	}

}


module.exports = ImportAPI;
