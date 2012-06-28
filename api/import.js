var config = require('../config.js'),
	models = require("../models.js"),
	permissions = require("../permissions.js"),
	utils = require("../utils.js");

var Point = models.Point,
	PointCollection = models.PointCollection,
	handleDbOp = utils.handleDbOp;

var ImportAPI = function(app) {
	app.post('/api/import/', function(req, res){

		// TODO: This only serves for testing
		if (!req.body['file']) {
			switch(req.body.converter) {
				case 'Earthquake Dataset':
					req.body['file'] = 'earthquakes.csv';
					break;
				
				case 'Nuclear Reactors':
					req.body['file'] = 'reactors.csv';
					break;
				
				case 'Safecast Dataset':
					req.body['file'] = 'measurements-out.csv';
					break;
			}
		}
		
		var file = req.body['file'];
		var path = '/public/data/' + req.body['file'];
		var type =  file.split('.').pop();

		var ConversionError = function() {};

		/**
		* Converts a string like ' y.yyy ,  -xx.x' to [x, y]
		*/	
		var latLngWithCommaFromString = function(field) {
			return function() {
				var match = String(this.get(field)).match(/^\s*([0-9\.\-]+)\s*,\s*([0-9\.\-]+)\s*$/);
				if (match) return [parseFloat(match[2]), parseFloat(match[1])];
				return new ConversionError();
			}
		};

		switch(req.body.converter) {
			
			case 'Standard (loc, val, date)':
				
				var converter = {
					fields: {
						val: function() {
							return parseFloat(this.get('val'));
						}
						,datetime: function() {
							var d = Date.parse(String(this.get('date')));
							return new Date(d);
						}
						,loc: function() {
							var loc = this.get('loc').split(' ');
							return [parseFloat(loc[1]), parseFloat(loc[0])];
						}
					}
				};
				
			break;
			
			case 'Earthquake Dataset':
			
				var converter = {
					fields: {
						val: function() {
							return parseFloat(this.get('mag'));
						}
						,datetime: function() {
							return new Date(this.get('year'), this.get('month') - 1, this.get('day'));
						}
						,loc: latLngWithCommaFromString('location')
					}
				};
			
			break;
			
			case 'Nuclear Reactors':
			
				var converter = {
					fields: {
						val: function() {
							return parseFloat(this.get('val'));
						}
						,datetime: function() {
							return new Date(String(this.get('year')));
						},
						label: function() {
							return this.get('Facility') + ' (' + this.get('ISO country code') + ')';
						}
						,loc: latLngWithCommaFromString('location')
					}
				};
				
			break;
			
			case 'Safecast Dataset':
			
				var converter = {
					fields: {
						val: function() {
							return parseFloat(this.get('value')) * (this.get('unit') == 'cpm' ? 1.0 : 350.0);
						}
						/*,altVal: function() {
							return [parseFloat(this.get('value'))] / (this.get('unit') == 'cpm' ? 350.0 : 1.0);
						}*/
						,datetime: function() {
							return new Date(this.get('captured_at'));
						}
						,loc: function() {
							return [parseFloat(this.get('lng')), parseFloat(this.get('lat'))];
						}
					}
				};
			
			break;
			
			default:
		}

		var clamp180 = function(deg) {
			if (deg < -360 || deg > 360) {
				deg = deg % 360;	
			} 
			if (deg < -180) {
				deg = 180 + deg % 180;
			}
			if (deg > 180) {
				deg = 180 - deg % 180;
			}
			if (deg == 180) {
				deg = -180;
			}

			return deg;
		};

		var importCount = 0;
		var fieldNames;
		var FIRST_ROW_IS_HEADER = true;
		var originalCollection = 'o_' + new mongoose.Types.ObjectId();
		var Model = mongoose.model(originalCollection, new mongoose.Schema({ any: {} }), originalCollection);
		var limitMax = 0;
		var limitSkip = 0;
		var appendCollectionId = null;
		
		var convertOriginalToPoint = function(data, converters) {
			var doc = {};
			for (var destField in converters.fields) {
				var f = converters.fields[destField];
				doc[destField] = f.apply(data);
				if (doc[destField] instanceof ConversionError) {
					console.log('ConversionError on field '+destField);
					return false;
				} 
			}
			doc['loc'][0] = clamp180(doc['loc'][0]);
			doc['loc'][1] = clamp180(doc['loc'][1]);
			return new Point(doc);
		}

		var runImport = function(collection) {
			collection.active = false;
			collection.status = config.DataStatus.IMPORTING;

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
						collection.collectionid = collection.get('_id'); // TODO: deprecated
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
										
										var point = convertOriginalToPoint(model, converter);
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