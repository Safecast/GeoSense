var config = require('../../config'),
	models = require('../../models'),
	permissions = require('../../permissions'),
	utils = require('../../utils'),
	apiUtil = require('../util'),
	coordinates = require('../../geogoose/').coordinates,
	errors = require('../../errors'),
	url = require('url'),
	console = require('../../ext-console.js'),
	mongoose = require('mongoose'),
	_ = require('cloneextend'),
	moment = require('moment');

	Map = models.Map,
	GeoFeatureCollection = models.GeoFeatureCollection,
	handleDbOp = utils.handleDbOp;

var FeatureAPI = function(app) 
{
	var retrieveLayer = function(req, res, callback) 
	{
		Map.findOne({publicslug: req.params.publicslug})
			.populate('layers.featureCollection')
			.populate('layers.layerOptions')
			.populate('createdBy')
			.populate('modifiedBy')
			.exec(function(err, map) {
				if (handleDbOp(req, res, err, map, 'map', permissions.canViewMap)) return;
				var mapLayer = map.layers.id(req.params.layerId),
					featureCollection = mapLayer ? mapLayer.featureCollection : null;

				if (!mapLayer || !featureCollection) {
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
					if (!err && featureCollection) {
						res.send(featureCollection);
					} else {
						res.send('collection not found', 404);
					}
				});
		});

		app.get('/api/featurecollections', function(req, res)
		{
			var urlObj = url.parse(req.url, true),
				filterQuery = {$and: [{active: true}, {status: config.DataStatus.COMPLETE}]};
			if (urlObj.query.q && typeof urlObj.query.q == 'string') {
				var rx = {$regex: '.*' + urlObj.query.q + '.*', $options: 'i'};
				filterQuery.$or = [
					{title: rx},
					{tags: rx}
				];
			}
			GeoFeatureCollection.find(filterQuery)
				.sort({title: 1})
				.populate('defaults')
				.populate('createdBy')
				.populate('modifiedBy')
				.exec(function(err, collections) {
					if (handleDbOp(req, res, err, collections)) return;
			    	var countQueue = collections.map(function(collection) {
		    			return collection;
			    	});
			    	
			    	var dequeueCount = function() {
			    		if (!countQueue.length) {
				    		res.send(collections.map(function(collection) {
					    		return apiUtil.prepareFeatureCollectionResult(req, collection, null, collection.extraAttrs);
				    		}));
					    	return;
			    		}
						var collection = countQueue.shift();
			    		collection.getFeatureModel().count(function(err, c) {
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

		app.get('/api/map/:publicslug/layer/:layerId/features', function(req, res) 
		{
			retrieveLayer(req, res, function(map, mapLayer, featureCollection) {
				var urlObj = url.parse(req.url, true),
					filterQuery = {},
					queryFields = null,
					queryOptions = {'limit': config.MAX_RESULT_COUNT},
					zoom = parseInt(urlObj.query.z) || 0,
					bbox = urlObj.query.b,
					timeGrid = urlObj.query.t,
					strDate = urlObj.query.d,
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

                var tileSize = config.GRID_SIZES[zoom],
					mapReduceOpts = {
						tileSize: (featureCollection.tile && featureCollection.tile.length ? tileSize : undefined)
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
                		console.info('Finding with $geoIntersects');
                		var bboxW = bbox[2] - bbox[0];
	                	if (Math.abs(bboxW) > 180) {
	                		console.warn('bbox is wider than 180°, splitting it in two');
	                		findQueue = [
	                			FindFeatureModel.geoIntersects(coordinates.polygonFromBbox([bbox[0], bbox[1], bbox[0] + bboxW / 2, bbox[3]])),
	                			FindFeatureModel.geoIntersects(coordinates.polygonFromBbox([bbox[0] + bboxW / 2, bbox[1], bbox[2], bbox[3]])),
	                		];
	                	} else {
	                		console.log(JSON.stringify(coordinates.polygonFromBbox(bbox)));
	                		findQueue = [
	                			FindFeatureModel.geoIntersects(coordinates.polygonFromBbox(bbox)),
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
            		console.success('Sending features:', features.length);
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
							console.success('Found features:', docs.length);
							features = features.concat(docs);
							if (queryOptions.limit) {
								queryOptions.limit -= docs.length;
							}
							dequeueFind();
						});
                };

				FeatureModel.count(filterQuery, function(err, count) {
					if (handleDbOp(req, res, err, true)) return;
					extraAttrs.properties.counts.full = count;
					console.info('full count: ', count);
                    dequeueFind();
				});

			});
        });

		app.get('/api/map/:publicslug/layer/:layerId/histogram', function(req, res) {
			retrieveLayer(req, res, function(map, mapLayer, featureCollection) {
				var	mapReduceOpts = {},
					FindFeatureModel = featureCollection.getMapReducedFeatureModel(mapReduceOpts);
				
			});
		});

    }
};

module.exports = FeatureAPI;
