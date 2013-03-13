var config = require('../../config'),
	models = require('../../models'),
	permissions = require('../../permissions'),
	utils = require('../../utils'),
	coordinates = require('../../geogoose/').coordinates,
	url = require('url'),
	console = require('../../ext-console.js'),
	mongoose = require('mongoose'),
	_ = require('cloneextend'),

	Map = models.Map,
	GeoFeatureCollection = models.GeoFeatureCollection,
	handleDbOp = utils.handleDbOp;

var FeatureAPI = function(app) 
{
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
					var mapLayer = map.layers.id(req.params.layerId),
						featureCollection = mapLayer ? mapLayer.featureCollection : null;

					if (!mapLayer || !featureCollection) {
						res.send('map layer not found', 404);
						return;
					} 

					var urlObj = url.parse(req.url, true),
						filterQuery = {},
						queryFields = null,
						queryOptions = {'limit': config.MAX_RESULT_COUNT},
						zoom = parseInt(urlObj.query.z) || 0,
						bbox = urlObj.query.b,
						boxes,
						features = [];


					// adjust zoom						
					if (isNaN(zoom) || zoom < 0) {
						zoom = 0;
					} else if (zoom >= config.GRID_SIZES.length) {
						zoom = config.GRID_SIZES.length - 1;
					}

                    var gridSize = config.GRID_SIZES[zoom],
						mapReduceOpts = {
							gridSize: (featureCollection.tile ? gridSize : undefined)
						},
						extraAttrs = { counts: {
							full: 0, original: 0, max: 0, result: 0
						}};

					// adjust bbox and split into boxes if it wraps the dateline 
					// since MongoDB can't currently handle that
                    if (bbox && bbox.length == 4) {
                    	bbox = bbox.map(function(c, i) {
                            return Number(c) + (i < 2 ? -gridSize / 2 : gridSize / 2);
                    	});
                    	boxes = bbox.some(isNaN) ? 
                    		null : coordinates.adjustBboxForQuery(bbox);
                    }

                    var manyBoxes = boxes && boxes.length > 1,
                    	isMapReduced = (mapReduceOpts.gridSize 
                    		&& (featureCollection.maxReduceZoom == undefined || zoom < featureCollection.maxReduceZoom))
                    		|| mapReduceOpts.timebased,
                    	FeatureModel = featureCollection.getFeatureModel(),
				        FindFeatureModel = isMapReduced ? featureCollection.getMapReducedFeatureModel(mapReduceOpts) : FeatureModel;

                    console.log('Querying '+FindFeatureModel.collection.name, 'zoom:', zoom, ', boxes:', boxes, ' manyBoxes:', manyBoxes);

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
							.within(boxes.shift())
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
    }
};

module.exports = FeatureAPI;
