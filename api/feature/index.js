var config = require('../../config'),
	models = require('../../models'),
	permissions = require('../../permissions'),
	utils = require('../../utils'),
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
			    	res.send(collections);
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
					boxes,
					features = [],
					datetimeAttr = mapLayer.layerOptions && mapLayer.layerOptions.attrMap ? 
						mapLayer.layerOptions.attrMap.datetime : null;

				// adjust zoom						
				if (isNaN(zoom) || zoom < 0) {
					zoom = 0;
				} else if (zoom >= config.GRID_SIZES.length) {
					zoom = config.GRID_SIZES.length - 1;
				}

                var tileSize = config.GRID_SIZES[zoom-3],
					mapReduceOpts = {
						tileSize: (featureCollection.tile && featureCollection.tile.length ? tileSize : undefined)
					},
					extraAttrs = { counts: {
						full: 0, original: 0, max: 0, result: 0
					}};

				if (['yearly', 'weekly', 'hourly'].indexOf(timeGrid) != -1) {
					mapReduceOpts.timeGrid = timeGrid;
				}

				// adjust bbox and split into boxes if it wraps the dateline 
				// since MongoDB can't currently handle that
                if (bbox && bbox.length == 4) {
                	bbox = bbox.map(function(c, i) {
                        return Number(c) + (i < 2 ? -tileSize / 2 : tileSize / 2);
                	});
                	boxes = bbox.some(isNaN) ? 
                		null : coordinates.adjustBboxForQuery(bbox);
                }

                var manyBoxes = boxes && boxes.length > 1,
                	isMapReduced = (mapReduceOpts.tileSize 
                		&& (featureCollection.maxReduceZoom == undefined || zoom < featureCollection.maxReduceZoom))
                		|| (featureCollection.timebased && datetimeAttr),
                	FeatureModel = featureCollection.getFeatureModel(),
			        FindFeatureModel = isMapReduced ? featureCollection.getMapReducedFeatureModel(mapReduceOpts) : FeatureModel;

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

                console.log('Querying '+FindFeatureModel.collection.name, ', filterQuery:', filterQuery, ', zoom:', zoom, ', boxes:', boxes, ' manyBoxes:', manyBoxes, ', mapReduceOpts: ', mapReduceOpts);

                var sendFeatures = function(features) {
            		extraAttrs.counts.result = features.length;
            		if (isMapReduced) {
            			// this is the result of a MapReduce: determine counts
                		features.reduce(function(a, b) {
                			v = b.get('value');
                			a.max = Math.max(a.max, v.count);
                			a.original += v.count;
                			return a;
                		}, extraAttrs.counts);
            		} else {
            			// this is the original collection
						extraAttrs.counts.max = extraAttrs.counts.result;
						extraAttrs.counts.original = extraAttrs.counts.result;                    			
            		}

            		extraAttrs.features = features;
            		console.success('Sending features:', features.length);
            		res.send(featureCollection.toGeoJSON(extraAttrs));
            	};

                var dequeueBoxAndFind = function() {
                	if (!boxes.length 
                		|| (queryOptions.limit != undefined && queryOptions.limit <= 0)) {
	                		if (manyBoxes) {
	                			var ids = {};
	                			features = features.filter(function(feature) {
	                				var exists = ids[feature._id];
	                				ids[feature._id] = true;
	                				return !exists;
	                			});
	                		}
                    		sendFeatures(features);
                    		return;
                	}
					FindFeatureModel
						.geoIntersects(boxes.shift())
						.find(filterQuery)
						.setOptions(queryOptions)
						.select(queryFields)
						.exec(function(err, found) {
							if (handleDbOp(req, res, err, true)) return;
							console.log('Found features:', found.length);
							features = features.concat(found);
							if (queryOptions.limit) {
								queryOptions.limit -= found.length;
							}
							dequeueBoxAndFind();
						});
                };

                var findWithoutBox = function() {
					FindFeatureModel
						.find(filterQuery)
						.setOptions(queryOptions)
						.select(queryFields)
						.exec(function(err, found) {
							if (handleDbOp(req, res, err, true)) return;
							console.log('Found features:', found.length);
							sendFeatures(found);
						});
                };

				utils.modelCount(FeatureModel, filterQuery, function(err, count) {
					if (handleDbOp(req, res, err, true)) return;
					extraAttrs.counts.full = count;
					console.info('full count: ', count);
                    if (boxes){
	                    dequeueBoxAndFind();
                    } else {
                    	findWithoutBox();
                    }
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
