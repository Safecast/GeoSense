var config = require('../../config'),
	models = require('../../models'),
	permissions = require('../../permissions'),
	utils = require('../../utils'),
	apiUtil = require('../util'),
	coordinates = require('geogoose').coordinates,
	errors = require('../../errors'),
	url = require('url'),
	console = require('../../ext-console.js'),
	getAttr = require('transmeta').util.getAttr,
	mongoose = require('mongoose'),
	moment = require('moment');

	Map = models.Map,
	GeoFeatureCollection = models.GeoFeatureCollection,
	handleDbOp = utils.handleDbOp;

var FeatureAPI = function(app) 
{
	var retrieveLayer = function(req, res, callback) 
	{
		apiUtil.findMapForRequest(req)
			.populate('layers.featureCollection')
			.populate('layers.layerOptions')
			.populate('createdBy')
			.populate('modifiedBy')
			.exec(function(err, map) {
				if (handleDbOp(req, res, err, map, 'map', permissions.canViewMap)) return;
				var mapLayer = map.layers.id(req.params.layerId),
					featureCollection = mapLayer ? mapLayer.featureCollection : null;

				if (!mapLayer || !featureCollection 
					|| !permissions.canViewFeatureCollection(req, map, featureCollection)) {
						res.send('map layer not found', 404);
						return;
				} 

				callback(map, mapLayer, featureCollection);
		});
	};

	if (app) {

		app.get('/api/featurecollection/:id', function(req, res)
		{
			GeoFeatureCollection.findOne({_id: req.params.id, $or: [{active: true}, {status: config.DataStatus.IMPORTING}]})
				.populate('defaults')
				.exec(function(err, featureCollection) {
					if (handleDbOp(req, res, err, featureCollection, 'feature collection')) return;
					res.send(featureCollection);
				});
		});

		app.patch('/api/featurecollection/:id', [permissions.requireLogin], function(req, res)
		{
			var allowedFields = ['title', 'source', 'description', 'sharing'];
			GeoFeatureCollection.findOne({_id: req.params.id, $or: [{active: true}, {status: config.DataStatus.IMPORTING}]})
				.populate('defaults')
				.populate('createdBy')
				.populate('modifiedBy')
				.exec(function(err, featureCollection) {
					if (handleDbOp(req, res, err, featureCollection, 'feature collection', permissions.canAdminModel)) return;

					allowedFields.forEach(function(k) {
						if (req.body[k] != undefined) {
							featureCollection.set(k, req.body[k]);
						}
					});
					featureCollection.save(function(err, featureCollection) {
						if (handleDbOp(req, res, err, featureCollection, 'feature collection')) return;
						res.send(featureCollection);
					});
				});
		});

		app.get('/api/featurecollection/:id/histogram', function(req, res) {
			GeoFeatureCollection.findOne({_id: req.params.id, $or: [{active: true}, {status: config.DataStatus.IMPORTING}]})
				.populate('defaults')
				.exec(function(err, featureCollection) {
					if (handleDbOp(req, res, err, featureCollection, 'feature collection')) return;
					var	numBins = config.HISTOGRAM_SIZES[0],
						mapReduceOpts = {histogram: numBins},
						attrMap = featureCollection.defaults.attrMap,
						FindFeatureModel = featureCollection.getMapReducedFeatureModel(mapReduceOpts),
						numericExtremes = getAttr(featureCollection.extremes, attrMap.numeric),
						binSize = (numericExtremes.max - numericExtremes.min) / numBins;
	
					console.log('Loading histogram for', FindFeatureModel.collection.name);
					FindFeatureModel.find()
						.sort({'_id': 1})
						.exec(function(err, docs) {
							if (handleDbOp(req, res, err, docs.length)) return;
							var result = {
								properties: {
									numBins: numBins,
									binSize: binSize
								}, 
								items: docs.map(function(doc) {
									var value = doc.get('value');
									return {
										bin: Number(doc._id),
										count: value.count,
										properties: value.properties
									}
								})
							};
							res.send(result);
						});
				});
		});

		app.get('/api/featurecollections', function(req, res)
		{
			var urlObj = url.parse(req.url, true),
				page = parseInt(req.query.p),
				page = isNaN(page) ? 0 : page,
				limit = parseInt(req.query.l),
				limit = isNaN(limit) ? 20 : Math.max(1, Math.min(40, limit)),
				filterQuery = {$and: [{active: true}, {status: config.DataStatus.COMPLETE}]},
				query,
				featureCountQuery = {geometry: {$ne: null}};
				type = ['user', 'public'].indexOf(urlObj.query.t) != -1 ? urlObj.query.t : 'public';
			
			if (urlObj.query.q && typeof urlObj.query.q == 'string') {
				query = urlObj.query.q;
				var rx = {$regex: '.*' + query + '.*', $options: 'i'};
				filterQuery.$or = [
					{title: rx},
					{tags: rx}
				];
			}

			switch (type) {
				case 'user':
					filterQuery.createdBy = req.user._id;
					break;
				case 'public':
					permissions.queryPublic(filterQuery);
					break;
			}

			console.log('Finding ' + type + ' feature collections, query:', query, ', limit:', limit, ', page:', page);

			GeoFeatureCollection.find(filterQuery)
				.sort({title: 1})
				.limit(limit)
				.skip(page * limit)
				.populate('defaults')
				.populate('createdBy')
				.populate('modifiedBy')
				.exec(function(err, collections) {
					if (handleDbOp(req, res, err, collections)) return;
					var countQueue = collections.map(function(collection) {
						return collection;
					});
					console.log('found collections: '+collections.length);
					
					var dequeueCount = function() {
						if (!countQueue.length) {
							res.send(collections.map(function(collection) {
								return apiUtil.prepareFeatureCollectionResult(req, collection, null, collection.extraAttrs);
							}));
							return;
						}
						var collection = countQueue.shift();
						collection.getFeatureModel().count(featureCountQuery, function(err, c) {
							if (handleDbOp(req, res, err, true)) return;
							collection.extraAttrs = {
								counts: {
									full: c
								}
							};
							dequeueCount();
						});
					};
					dequeueCount();
				});
		});

		var mapFeaturesRoute = function(req, res) 
		{
			retrieveLayer(req, res, function(map, mapLayer, featureCollection) {
				var urlObj = url.parse(req.url, true),
					filterQuery = {'geometry': {$ne: undefined}},
					queryFields = null,
					queryOptions = {'limit': config.MAX_RESULT_COUNT},
					zoom = parseInt(urlObj.query.z) || 0,
					bbox = urlObj.query.b,
					timeGrid = urlObj.query.t,
					strDate = urlObj.query.d,
					returnOriginal = urlObj.query.o && Number(urlObj.query.o) != 0,
					date,
					features = [],
					datetimeAttr = mapLayer.layerOptions && mapLayer.layerOptions.attrMap ? 
						mapLayer.layerOptions.attrMap.datetime : null;

				// adjust zoom						
				if (isNaN(zoom)) {
					zoom = 0;
				} else {
					var adjustZoom = 0;
					var zoom = Math.max(0, Math.min(
						Object.keys(config.GRID_SIZES).length, zoom + adjustZoom));
				}

				var enableTiles = !returnOriginal && featureCollection.tile && featureCollection.tile.length,
					tileSize = enableTiles ? config.GRID_SIZES[zoom] : 0,
					mapReduceOpts = {
						tileSize: (enableTiles ? tileSize : undefined)
					},
					extraAttrs = { 
						properties: {
							counts: {
								full: 0, original: 0, max: 0, result: 0
							}						
						}
					};

				if (['yearly', 'weekly', 'hourly'].indexOf(timeGrid) != -1) {
					mapReduceOpts.timeGrid = timeGrid;
				}

				var isMapReduced = (mapReduceOpts.tileSize 
						&& (featureCollection.maxReduceZoom == undefined || zoom < featureCollection.maxReduceZoom))
						|| (featureCollection.timebased && datetimeAttr),
					FeatureModel = featureCollection.getFeatureModel(),
					FindFeatureModel = isMapReduced ? featureCollection.getMapReducedFeatureModel(mapReduceOpts) : FeatureModel,
					findQueue;

				if (bbox && bbox.length == 4) {
					bbox = bbox.map(function(c, i) {
						return Number(c) + (i < 2 ? -tileSize / 2 : tileSize / 2);
					});
					if (bbox.some(isNaN)) {
						bbox = null;
					} else {
						var bboxW = Math.abs(bbox[2] - bbox[0]),
							bboxH = Math.abs(bbox[3] - bbox[1]);
						// MongoDB manual: "Any geometry specified with GeoJSON to $geoIntersects queries, 
						// must fit within a single hemisphere"
						if (bboxW > 180 || bboxH > 90) {
							/*
							// TODO: this solution is still not reliable and won't find some features in the middle of the circle:
							// just disabling filtering will at least not lose any features
							console.warn('bbox is wider than 180°, using $near instead');
							var center = [bbox[0] + bboxW / 2, bbox[1] + bboxH / 2];
							findQueue = [
								FindFeatureModel.near({type: 'Point', coordinates: center}, 
									coordinates.haversineDistance(center, [bbox[0], bbox[1]]))
							];*/
						} else {
							var geometry = coordinates.polygonFromBbox(bbox);
							geometry.coordinates[0] = geometry.coordinates[0].map(function(c) {
								return coordinates.coordinates2d(c);
							});
							console.info('Finding with $geoIntersects', JSON.stringify(geometry));
							findQueue = [
								FindFeatureModel.geoIntersects(geometry)
							];
						}
					}
				}
				if (!findQueue) {
					findQueue = [FindFeatureModel.where()];
				}

				var manyQueries = findQueue.length > 1;
				if (isMapReduced && mapReduceOpts.tileSize) {
					extraAttrs.properties.gridSize = [tileSize, tileSize];
				}

				if (isMapReduced && mapReduceOpts.timeGrid) {
					switch (mapReduceOpts.timeGrid) {
						case 'yearly':
							date = new Date(strDate, 0, 1, 0, 0, 0);
							break;
						// TODO treat other cases
					}
					var err;
					if (!strDate) {
						err = new errors.ValidationError("required parameter: d");
					} else if (!moment(date).isValid()) {
						err = new errors.ValidationError("invalid date: " + strDate);
					}
					if (handleDbOp(req, res, err, true)) return;
					// TODO: might conflict with counts
					filterQuery['value.' + datetimeAttr + '.min'] = date;
				}

				console.log('Querying '+FindFeatureModel.collection.name, ', filterQuery:', filterQuery, ', zoom:', zoom, ' manyQueries:', manyQueries, ', mapReduceOpts: ', mapReduceOpts);

				var sendFeatures = function(features) {
					if (manyQueries) {
						var ids = {};
						features = features.filter(function(feature) {
							var exists = ids[feature._id];
							ids[feature._id] = true;
							return !exists;
						});
					}

					extraAttrs.properties.counts.result = features.length;
					if (isMapReduced) {
						// this is the result of a MapReduce: determine counts
						features.reduce(function(a, b) {
							v = b.get('value');
							a.max = Math.max(a.max, v.count);
							a.original += v.count;
							return a;
						}, extraAttrs.properties.counts);

					} else {
						// this is the original collection
						extraAttrs.properties.counts.max = extraAttrs.properties.counts.result;
						extraAttrs.properties.counts.original = extraAttrs.properties.counts.result;                    			
					}

					extraAttrs.features = features;
					if (bbox) {
						extraAttrs.bbox = bbox;
					}
					console[console.success ? 'success' : 'info']('Sending features:', features.length);
					res.send(featureCollection.toGeoJSON(extraAttrs));
				};

				var dequeueFind = function() {
					if (!findQueue.length 
						|| (queryOptions.limit != undefined && queryOptions.limit <= 0)) {
							sendFeatures(features);
							return;
					}
					findQueue.shift()
						.find(filterQuery)
						.setOptions(queryOptions)
						.select(queryFields)
						.exec(function(err, docs) {
							if (handleDbOp(req, res, err, true)) return;
							console[console.success ? 'success' : 'info']('Found features:', docs.length);
							docs.forEach(function(doc) {
								features.push(doc);
							});
							if (queryOptions.limit) {
								queryOptions.limit -= docs.length;
							}
							dequeueFind();
						});
				};

				var cacheKey = FeatureModel.collection.name + JSON.stringify(filterQuery),
					countOp = function(callback) {
						FeatureModel.count(filterQuery, callback);
					};

				utils.cachedOp(countOp, cacheKey, config.EXPENSIVE_OPERATION_CACHE_TIME, function(err, count) {
					if (isMapReduced) {
						// adapt filterQuery to MapReduce collection
						Object.keys(filterQuery).forEach(function(key) {
							filterQuery['value.' + key] = filterQuery[key];
							delete filterQuery[key];
						});
					}
					if (handleDbOp(req, res, err, true)) return;
					extraAttrs.properties.counts.full = count;
					console.info('full count: ', count);
					dequeueFind();
				});

			});
		};

		app.get('/api/map/s/:secretSlug/layer/:layerId/features', mapFeaturesRoute);
		app.get('/api/map/:slug/layer/:layerId/features', mapFeaturesRoute);

	}
};


module.exports = FeatureAPI;
