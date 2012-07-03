var config = require('../config.js'),
	models = require("../models.js"),
	permissions = require("../permissions.js"),
	utils = require("../utils.js"),
	conversion = require("./conversion/conversion.js"),
  	mongoose = require('mongoose'),
	csv = require('csv'),    
	date = require('datejs'),
	url = require('url');

var Point = models.Point,
	PointCollection = models.PointCollection,
	LayerOptions = models.LayerOptions,
	handleDbOp = utils.handleDbOp;

var ImportAPI = function(app) {
	app.post('/api/import/', function(req, res){

		// TODO: This only serves for testing
		var converter;
		if (!req.body['file']) {
			switch(req.body.converter) {
				default:
					converter = require('./conversion/point/default.js').PointConverter;
					break;

				case 'Earthquake Dataset':
					req.body['file'] = 'earthquakes.csv';
					converter = require('./conversion/point/earthquakes.js').PointConverter;
					break;
				
				case 'Nuclear Reactors':
					req.body['file'] = 'reactors.csv';
					converter = require('./conversion/point/reactors.js').PointConverter;
					break;
				
				case 'Safecast Dataset':
					req.body['file'] = 'measurements-out.csv';
					converter = require('./conversion/point/safecast.js').PointConverter;
					break;
			}
		}
		
		var file = req.body['file'];
		var path = '/../public/data/' + req.body['file'];
		var type =  file.split('.').pop();
		var importCount = 0;
		var fieldNames;
		var FIRST_ROW_IS_HEADER = true;
		var originalCollection = 'o_' + new mongoose.Types.ObjectId();
		var Model = mongoose.model(originalCollection, new mongoose.Schema({ any: {} }), originalCollection);
		var limitMax = 20000;
		var limitSkip = 0;
		var appendCollectionId = null;
		
		var runImport = function(collection) {
			collection.active = false;
			collection.status = config.DataStatus.IMPORTING;
			collection.createdBy = collection.modifiedBy = req.session.user;

			collection.save(function(err, collection) {
			    if (!err) {
			    	var newCollectionId = collection.get('_id');
			    	console.log('saved PointCollection "'+collection.get('title')+'" = '+newCollectionId);
					var response = {
						'pointCollectionId': newCollectionId,
					};
					res.send(response);

					var maxVal, minVal;
					var numRead = 0;
					var numImport = 0;
					var numSaving = 0;
					var numDone = 0;
					var ended = false;
					var finalized = false;

					var finalize = function() {
						finalized = true;
				    	collection.maxVal = maxVal;
						collection.minVal = minVal;
						collection.cropDistribution = minVal / maxVal > config.MIN_CROP_DISTRIBUTION_RATIO;
						collection.active = true;
						collection.reduce = numDone > 1000;
						collection.status = config.DataStatus.UNREDUCED;
						collection.save(function(err) {
					    	debugStats('*** finalized and activated collection ***');
						});
					};

					var debugStats = function(pos) {
						console.log('* '+collection.get('_id')+' '+pos+' -- stats: numRead: ' + numRead + ', numSaving: '+numSaving + ', numDone: '+numDone);
					};

					function postSave(self) {
						if (numSaving == 0) {
							if (ended) {
								if (!finalized) {
									finalize();
								}
								return;
							}
					    	debugStats('resume');
					    	self.readStream.resume();
						}
					}

					function makeSaveHandler(point, self) {
						return function(err) {

							if (err) console.log('*** error', err);

							point = null;
							numSaving--;
							numDone++;
					    	debugStats('on save point');
					    	postSave(self);
						}
					}

					switch(type) {
						case 'csv':

							csv()
							    .fromPath(__dirname + path)
							    .transform(function(data){
							        data.unshift(data.pop());
							        return data;
							    })
							    .on('data',function(data, index) {
									if (ended) return;
									numRead++;
							    	debugStats('on data');
							    	var self = this;
							    	self.readStream.pause();
									if (FIRST_ROW_IS_HEADER && !fieldNames) {
										fieldNames = data;
								    	debugStats('using row as header');
									} else {
										numImport++;
										if (numImport <= limitSkip) {
									    	debugStats('skipping row');
									    	return;
										}
										if (limitMax && numImport - limitSkip > limitMax) {
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
											doc['data'] = data;
										}
										var model = new Model(doc);
										
										/*numSaving++;
										model.save(function(err) {
									    	debugStats('on save original');
											doc = null; 
											model = null;
											numSaving--;
											if (numSaving == 0) {
										    	self.readStream.resume();
										    	debugStats('resume');
											}
										});*/
										
										var point = conversion.convertModel(model, converter, Point);
										model = null;

										if (point) {
											point.pointCollection = collection;
											point.created = new Date();
											point.modified = new Date();
											if (maxVal == undefined || maxVal < point.get('val')) {
												maxVal = point.get('val');
											}

											if (minVal == undefined || minVal > point.get('val')) {
												minVal = point.get('val');
											}
											numSaving++;
											importCount++;

											var saveHandler = makeSaveHandler(point, self);
											point.save(saveHandler);
										} else {
									    	postSave(self);
										}
				
										if (numRead == 1 || numRead % 1000 == 0) {
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

									    	debugStats('update progress');
									    	collection.progress = numDone;
									    	collection.save();
										}
									}
						
							    })
							    .on('end',function(count) {
							    	ended = true;
							    	debugStats('on end');
									if (numSaving == 0 && !finalized) {
										finalize();
									}
							    })
							    .on('error',function(error){
							        console.log(error.message);
							    });
								break;
					
						case 'json':
					
							console.log('/public/data/reactors.json');
							var parsedJSON = require('/public/data/reactors.json');
							//console.log(parsedjson);
					
							break;
					}
				}
			});
		};

		if (!appendCollectionId) {
			console.log('Creating new collection');

			var defaults = new LayerOptions(config.COLLECTION_DEFAULTS);
			for (var key in config.COLLECTION_DEFAULTS) {
				if (req.body[key]) {
					defaults[key] = req.body[key];
				}
			}
			defaults.save(function(err) {
				if (err) {
					res.send('server error', 500);
					return;
				}
				runImport(new PointCollection({
				    name: req.params.name,
					defaults: defaults._id,
					title: req.body.title || file,
					description: req.body.description,
					unit: "",
					progress: 0,
				}));
			});

		} else {
			console.log('Appending to collection '+appendCollectionId);
			PointCollection.findOne({_id: appendCollectionId}, function(err, collection) {
				if (err) {
					console.log('Could not find collection');
					return;
				}
				runImport(collection);
			});
		}

	});

}

module.exports = ImportAPI;