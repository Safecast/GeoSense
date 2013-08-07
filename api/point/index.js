var config = require('../../config.js'),
	models = require("../../models.js"),
	permissions = require("../../permissions.js"),
	utils = require("../../utils.js"),
	url = require('url'),
	mongoose = require('mongoose'),
	console = require('../../ext-console.js'),
	_ = require('cloneextend');

var Point = models.Point,
	PointCollection = models.PointCollection,
	GeoFeatureCollection = models.GeoFeatureCollection,
	Map = models.Map,
	handleDbOp = utils.handleDbOp;

var PointAPI = function(app) 
{
	if (app) {
		app.get('/api/histogram/:pointcollectionid', function(req, res) {
			PointCollection.findOne({_id: req.params.pointcollectionid, active: true}, function(err, pointCollection) {
				if (!err && pointCollection) {
					collectionName = 'r_points_hist-' + config.HISTOGRAM_SIZES[0];
					var Model = models.adHocModel(collectionName);
					var query = {'value.pointCollection': pointCollection.linkedPointCollection || pointCollection._id};
					console.log(query);
					Model.find(query, function(err, datasets) {
						if (err) {
							res.send('server error', 500);
							return;
						}
						yValues = [];
						for (var i = 0; i < datasets.length; i++) {
							var reduced = datasets[i].get('value');
							yValues[reduced.val.x] = reduced.count;
						}
						//console.log(values);
						var histogram = []; 
						for (var x = 0; x < config.HISTOGRAM_SIZES[0]; x++) {
							histogram.push({
								x: x,
								y: yValues[x] ? yValues[x] : 0,
								val: 1 / config.HISTOGRAM_SIZES[0] * x * (pointCollection.maxVal - pointCollection.minVal) + pointCollection.minVal
							})
						}
						res.send(histogram);
					});
				} else {
					res.send('collection not found', 404);
				}
			});
		});

		app.get('/api/pointcollection/:id', function(req, res){
			PointCollection.findOne({_id: req.params.id, $or: [{active: true}, {status: config.DataStatus.IMPORTING}]})
				.populate('defaults')
				.exec(function(err, pointCollection) {
					if (!err && pointCollection) {
						res.send(pointCollection);
					} else {
						res.send('collection not found', 404);
					}
				});
		});

		app.get('/api/pointcollections', function(req, res){
		  	GeoFeatureCollection.find({active: true}, null, {sort: {'title': 1}}, function(err, documents) {
		    	res.send(documents);
			});
		});

		app.get('/api/map/:publicslug/layer/:layerId/features', function(req, res) 
		{
			Map.findOne({publicslug: req.params.publicslug})
				.populate('layers.featureCollection')
				.populate('layers.layerOptions')
				.populate('createdBy')
				.populate('modifiedBy')
				.exec(function(err, map) {
					if (handleDbOp(req, res, err, map, 'map', permissions.canViewMap)) return;
					var mapLayer = map.layers.id(req.params.layerId);
					if (!mapLayer) {
						res.send('map layer not found', 404);
					} else {

						var featureCollection = mapLayer.featureCollection,
							urlObj = url.parse(req.url, true),
							queryOptions = {},
							filterQuery = {},
							zoom = parseInt(urlObj.query.z) || 0;
						
						if (isNaN(zoom) || zoom < 0) {
							zoom = 0;
						} else if (zoom >= config.GRID_SIZES.length) {
							zoom = config.GRID_SIZES.length - 1;
						}

						// TODO
						var bbox = null,
							conditions = {},
							fields = null,
							gridSize = config.GRID_SIZES[zoom],
							findOpts = {};

						if (featureCollection.reduce) {
							findOpts.gridSize = gridSize;
						}
						
						featureCollection.findFeaturesWithin(bbox, conditions, fields, findOpts, function(err, collection) {
							//collection.features = [collection.features[0]];
							res.send(collection.toGeoJSON());
						});
						return;

						var timeGrid = false,
							reduceKey = false;
						if (urlObj.query.t) {
							var split = urlObj.query.t.split(':');
							switch (split[0]) {
								case 'y':
									timeGrid = 'yearly';
									break;
								case 'w':
									timeGrid = 'weekly';
									break;
								case 'd':
									timeGrid = 'daily';
									break;
							}
							switch (urlObj.query.m) {
								case 'datetime':
									reduceKey = 'datetime';
									break;
							}
							if (timeGrid) {
								var newDate = function(endOfDay, y, m, d, h, i, s) {
									if (m) {
										m--;
									} else {
										m = 0;
									}
									if (!d) d = 1;
									if (!h) h = (!endOfDay ? 0 : 23);
									if (!i) i = (!endOfDay ? 0 : 59);
									if (!s) s = (!endOfDay ? 0 : 59);
									return new Date(parseInt(y), parseInt(m), parseInt(d), parseInt(h), parseInt(i), parseInt(s));
								}
								if (urlObj.query.from) {
									var split = urlObj.query.from.split(/[:\-T]/);
									split.unshift(false);
									if (!filterQuery['value.datetime']) filterQuery['value.datetime'] = {};
									filterQuery['value.datetime']['$gte'] = newDate.apply(null, split);
								}
								if (urlObj.query.to) {
									var split = urlObj.query.to.split(/[:\-T]/);
									split.unshift(true);
									if (!filterQuery['value.datetime']) filterQuery['value.datetime'] = {};
									filterQuery['value.datetime']['$lte'] = newDate.apply(null, split);
								}
							}
						}

						var reduce = pointCollection.get('reduce');
						if (pointCollection.gridSize && (gridSize < pointCollection.gridSize || !reduce)) {
							reduce = false;
							gridSize = pointCollection.gridSize;
						}
						console.log('*** zoom ' + zoom + ', grid size ' + gridSize);
						var collectionName, pointQuery, boxes;

						if (urlObj.query.b && urlObj.query.b.length == 4) {
							var b = urlObj.query.b;
							console.log('bounds:', b);	

							for (var i = 0; i < 4; i++) {
								b[i] = parseFloat(b[i]) || 0;
								b[i] = b[i] + (i < 2 ? -gridSize / 2 : gridSize / 2);
							}

							// Mongo currently doesn't handle the transition around the dateline (x = +-180)
							// Thus, if the bounds contain the dateline, we need to query for the box to 
							// the left and the box to the right of it. 
							if (b[0] < -180) {
								boxes = [
									[[180 + b[0] % 180, b[1]], [180, b[3]]],
									[[-180, b[1]], [b[2], b[3]]]
								];
							} else if (b[2] > 180) {
								boxes = [
									[[b[0], b[1]], [180, b[3]]],
									[[-180, b[1]], [-180 + b[2] % 180, b[3]]]
								];
							} else if (b[0] > b[2]) {
								boxes = [
									[[b[0], b[1]], [180, b[3]]],
									[[-180, b[1]], [b[2], b[3]]]
								];
							} else {
								boxes = [
									[[b[0], b[1]], [b[2], b[3]]]
								];
							}

							console.log('query within boxes: ', boxes.length, boxes);
						}

						// TODO: should count points in all boxes and not reduce if < 1000
						reduce = reduce && (!pointCollection.maxReduceZoom || zoom <= pointCollection.maxReduceZoom);

						var PointModel;
						var points = [];
						var queryExecuted = false; 
						var originalCount = 0;
						var maxReducedCount = 0;
						var fullCount;
						var reducedCollectionName = mapLayer.layerOptions.reduction ?
							'r_points_' + mapLayer.layerOptions.reduction
							: 'r_points_loc-%(gridSize)s' + (timeGrid ? '_%(timeGrid)s' : '');
						
						var adjustKeys = function(obj, prefix, prefixLevel, level) {
							var operators = ['gt', 'lt', 'gte', 'lte'],
								newObj = {};
							if (!level) {
								level = 0;
							}
							for (var k in obj) {
								var v = obj[k],
									newK;

								if (operators.indexOf(k) != -1) {
									newK = '$' + k;
								} else {
									var split = k.split('|');
									if (prefix && (!prefixLevel || level >= prefixLevel)) {
										split.unshift(prefix);
									}
									newK = split.join('.');
								}

								if (v instanceof Object && !(v instanceof Date)) {
									v = adjustKeys(obj[k], prefix, prefixLevel, level + 1);
								}
								newObj[newK] = v;
							}
							return newObj;
						}


						if (mapLayer.layerOptions.queryOptions) {
							queryOptions = _.cloneextend(_.clone(config.API_RESULT_QUERY_OPTIONS), 
								adjustKeys(mapLayer.layerOptions.queryOptions, reduce ? 'value' : null, 1));
						}

						if (mapLayer.layerOptions.filterQuery) {
							filterQuery = _.cloneextend(filterQuery, 
								adjustKeys(mapLayer.layerOptions.filterQuery, reduce ? 'value' : null));
						}
						
						var dequeueBoxQuery = function() {
							if (queryExecuted && (!boxes || boxes.length == 0)) {
								if (reduce) {
									console.log('Found '+points.length+' reduction points for '+originalCount+' original points.');
								} else {
									console.log('Found '+points.length+' points.');
								}
								var data = {
									fullCount: fullCount,
									originalCount: originalCount,
									resultCount: points.length,
									maxReducedCount: maxReducedCount,
									absMinVal: pointCollection.minVal,
									absMaxVal: pointCollection.maxVal,
									gridSize: gridSize,
									items: points
								};
								res.send(data);
								return;
							}

							if (boxes) {
								var box = boxes.shift();
								pointQuery[PointModel != Point ? 'value.loc' : 'loc'] = {$within: {$box : box}};
							}

							console.log('*** querying "' + collectionName + '" for '+pointCollection.get('title'), pointQuery, queryOptions, box);

							if (!reduceKey) {
								PointModel.find(pointQuery, null, queryOptions, function(err, datasets) {
									if (handleDbOp(req, res, err, datasets)) return;

									for (var i = 0; i < datasets.length; i++) {
										if (PointModel != Point) {
											var reduced = datasets[i].get('value');
											var p = {
												val: reduced.val,
												count: reduced.count,
												datetime: reduced.datetime,
												loc: [reduced.loc[0], reduced.loc[1]],
												label: reduced.label,
												description: reduced.description
											};
										} else {
											var p = {
												val: datasets[i].get('val'),
												count: 1,
												datetime: datasets[i].get('datetime'),
												loc: datasets[i].get('loc'),
												label: datasets[i].get('label'),
												description: datasets[i].get('description')
											};
										}
										points.push(p);
										originalCount += p.count;
										maxReducedCount = Math.max(maxReducedCount, p.count);
									}
									queryExecuted = true;
									dequeueBoxQuery();
								});
							} else {
								var command = {
									mapreduce: collectionName,
									query: pointQuery,
									map: function() {
										emit(this.value['datetime'], {
											val: this.value.val,
											count: this.value.count,
											datetime: this.value.datetime
										});
									}.toString(),
									reduce: function(key, values) {
										var result = {
											val: {
												sum: 0,
												max: values[0].val.max,
												min: values[0].val.min
											},
											count: 0,
											datetime: values[0].datetime
										};
										values.forEach(function(value) {
											result.val.sum += value.val.sum;
											if (value.val.max > result.val.max) result.val.max = value.val.max;
											if (value.val.min < result.val.min) result.val.min = value.val.min;
											result.count += value.count;
										});
										return result;
									}.toString(),
									finalize: function(key, value) {
										value.val.avg = value.val.sum / value.count;
										return value;
									}.toString(),
									out: {inline: 1}
								};
								mongoose.connection.db.executeDbCommand(command, function(err, res) {
									var datasets = res.documents[0].results;
									if (!datasets || !datasets.length) return;
									for (var i = 0; i < datasets.length; i++) {
										var p = datasets[i].value;
										points.push(p);
										originalCount += p.count;
										maxReducedCount = Math.max(maxReducedCount, p.count);
									}
									queryExecuted = true;
									dequeueBoxQuery();
								});
							}
						}

						utils.modelCount(Point, {'pointCollection': pointCollection.linkedPointCollection || pointCollection._id}, function(err, c) {
							fullCount = c;
							if (reduce) {
								collectionName = reducedCollectionName.format({
									timeGrid: timeGrid,
									gridSize: gridSize
								});
								PointModel = models.adHocModel(collectionName);
								//pointQuery = {'value.pointCollection': mongoose.Types.ObjectId(req.params.pointcollectionid)};
								pointQuery = {'value.pointCollection': pointCollection.linkedPointCollection || pointCollection._id};
								pointQuery = _.cloneextend(pointQuery, filterQuery);

								dequeueBoxQuery();
							} else {
								if (pointCollection.get('reduce') && !pointCollection.get('gridSize')) {
									collectionName = 'points';
									PointModel = Point;
									pointQuery = {'pointCollection': req.params.pointcollectionid};
								} else {
									collectionName = 'r_points_loc-0';
									PointModel = models.adHocModel(collectionName);
									pointQuery = {'value.pointCollection': pointCollection.linkedPointCollection || pointCollection._id};
								}
								dequeueBoxQuery();
							}
						});
					}

				});
		});
	}
};

module.exports = PointAPI;
