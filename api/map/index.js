var config = require('../../config.js'),
	models = require("../../models.js"),
	permissions = require("../../permissions.js"),
	utils = require("../../utils.js"),
	apiUtil = require('../util'),
	prepareMapResult = apiUtil.prepareMapResult,
	prepareLayerResult = apiUtil.prepareLayerResult,
	sortByPosition = apiUtil.sortByPosition,
	url = require('url'),
	mongoose = require('mongoose');

var Point = models.Point,
	GeoFeatureCollection = models.GeoFeatureCollection,
	Map = models.Map,
	LayerOptions = models.LayerOptions,
	User = models.User,
	handleDbOp = utils.handleDbOp,
	console = require('../../ext-console');

var MapAPI = function(app) 
{
	var self = this;
	
	if (app) {
		// Returns a list of maps
		app.get('/api/maps(\/latest|\/featured|\/user)' , function(req, res){
			var query = {status: config.MapStatus.PUBLIC};
			var options = {};
			switch (req.params[0]) {
				case '/latest':
					query.active = true;
					permissions.queryPublic(query);
					options.sort = {'createdAt': -1};
					options.limit = 20;		
					break;
				case '/featured':
					if (!config.DEBUG) {
						query.featured = {$gt: 0};
					}
					query.active = true;
					permissions.queryPublic(query);
					options.sort = {'featured': -1, 'createdAt': -1};
					options.limit = 10;		
					break;
				case '/user':
					if (req.user) {
						query.createdBy = req.user._id;
						options.sort = {'createdAt': -1};
					} else {
						res.send('permission denied', 403);
					}
					break;
			}
			Map.find(query, null, options)
				.populate('createdBy')
				.populate('modifiedBy')
				.exec(function(err, maps) {
					if (handleDbOp(req, res, err, maps)) return;
					var preparedMaps = [];
					for (var i = 0; i < maps.length; i++) {
						if (permissions.canViewMap(req, maps[i])) {
							preparedMaps.push(prepareMapResult(req, maps[i]));
						}
					}
					res.send(preparedMaps);
				});
		});

		// Creates and returns a new map
		app.post('/api/map', config.ANONYMOUS_MAP_CREATION ? [] : [permissions.requireLogin], function(req, res)
		{
			if (!permissions.canCreateMap(req)) {
				res.send('Cannot create map', 403);
				return;
			}

			var currDate = Math.round((new Date).getTime() / 1000);
			var collections = {};
			var slugCounter = 1;

			console.log(req.body);
			var map = new Map({
				title: req.body.title,
				description: '',
				collections: collections
			});	

			if (req.user) {
				map.createdBy = map.modifiedBy = req.user._id;
			}

			var makeUniqueSlugAndSave = function() 
			{
				map.slug = utils.slugify(req.body.title) + (slugCounter > 1 ? '-' + slugCounter : '');
				if (map.slug.match(config.RESERVED_URI)) {
					slugCounter++;
					makeUniqueSlugAndSave();
					return;
				}
				console.log('post new map, looking for existing slug "'+map.slug+'"')
				Map.findOne({slug: map.slug}, function(err, existingMap) {
					if (handleDbOp(req, res, err, true)) return;
					if (existingMap) {
						console.log('slug "' + map.slug + '" exists, increasing counter');
						slugCounter++;
						makeUniqueSlugAndSave();
					} else {
						console.log('saving map')
						map.save(function(err, map) {
							if (handleDbOp(req, res, err, map, 'map')) return;
							if (config.ANONYMOUS_MAP_CREATION && !req.user) {
								permissions.allowSessionAdmin(req, map);
							}
							if (req.xhr) {
								res.send(prepareMapResult(req, map));
							} else {
								res.redirect(config.BASE_URL + 'admin/' + map.slug);
							}
						});
					}
				});
			}

			makeUniqueSlugAndSave();
		});

		// Returns a specific map by slug
		var mapGetRoute = function(req, res) {
			apiUtil.findMapForRequest(req)
				.exec(function(err, map) {
					if (handleDbOp(req, res, err, map, 'map', permissions.canViewMap)) return;
					var preparedMap = prepareMapResult(req, map);
					res.send(preparedMap);
				});
		};

		app.get('/api/map/s/:secretSlug', mapGetRoute);
		app.get('/api/map/:slug', mapGetRoute);

		// Updates a map 
		var mapPatchRoute = function(req, res)
		{
			apiUtil.findMapForRequest(req)
				.exec(function(err, map) {
					if (handleDbOp(req, res, err, map, 'map', permissions.canAdminMap)) return;

					var fields = ['title', 'description', 'author', 
						'linkURL', 'twitter', 'initialArea', 'viewOptions', 
						'displayInfo', 'host', 'sharing'];

					for (var i = fields.length - 1; i >= 0; i--) {
						var f = req.body[fields[i]];
						if (f != undefined) {
							map[fields[i]] = f;
							//console.log(fields[i], f);
						}
					}

					if (map.host && map.host != '') {
						var split = map.host.split('://');
						map.host = split.pop();
					} else {
						map.host = undefined;
					}

					if (map.linkURL && map.linkURL != '') {
						var split = map.linkURL.split('://');
						map.linkURL = split.pop();
						map.linkURL = (split.length ? split.pop() : 'http') + '://' + map.linkURL;
					}

					if (map.twitter && map.twitter != '') {
						var split = map.twitter.split(/^@/);
						map.twitter = split.pop();
					}

					var email;
					if (req.body.createdBy) {
						email = req.body.createdBy.email;
					}

					if (email != undefined && ((!map.createdBy && email != '') || map.createdBy)) {
						var user, prevEmail;
						if (map.createdBy) {
							console.log('Saving email address to user:', email)
							user = map.createdBy;
						} else {
							console.log('Creating new user:', email)
							user = new User();
						}				
						prevEmail = user.get('email');
						user.email = email;
						user.save(function(err, user) {
							if (err && err.errors.email) {
								err.errors.email.path = 'createdBy.email';
							}
							if (handleDbOp(req, res, err, user, 'user')) return;
							map.createdBy = map.modifiedBy = user;
							map.save(function(err, map) {
								console[console.success ? 'success' : 'info']('map updated', err);
								if (handleDbOp(req, res, err, map, 'map')) return;

								// find again since createdBy and modifiedBy won't be populated after map.save()
								apiUtil.findMapForRequest(req)
									.exec(function(err, map) {
										if (handleDbOp(req, res, err, map, 'map')) return;
										res.send(prepareMapResult(req, map));
										if (prevEmail != user.email && config.SMTP_HOST) {
											console.log('emailing info to user');
											utils.sendEmail(user.email, 'Your map URLs', 'urls', {
												adminUrl: config.BASE_URL + 'admin/' + map.adminslug,
												publicUrl: config.BASE_URL + map.slug
											});
										}
									});
							});
						});
					} else {
						if (email == '') {
							map.createdBy = map.modifiedBy = null;
						}
						map.save(function(err, map) {
							if (handleDbOp(req, res, err, map, 'map')) return;
							console[console.success ? 'success' : 'info']('map updated');
							res.send(prepareMapResult(req, map));
						});
					}
				});
		};

		app.patch('/api/map/s/:secretSlug', mapPatchRoute);
		app.patch('/api/map/:slug', mapPatchRoute);

		// Deletes a map
		mapDeleteRoute = function(req, res)
		{
			apiUtil.findMapForRequest(req)
				.exec(function(err, map) {
					if (handleDbOp(req, res, err, map, 'map', permissions.canAdminMap)) return;

					while (map.layers.length > 0) {
						map.layers[0].layerOptions.remove();
						map.layers[0].remove();
					}

					map.remove(function(err) {
						if (handleDbOp(req, res, err, true)) return;
						console.log('map removed');
						res.send({_id: map._id});
					});
				});
		};

		app.delete('/api/map/s/:secretSlug', mapDeleteRoute);
		app.delete('/api/map/:slug', mapDeleteRoute);

		// Returns map layer
		var mapLayerGetRoute = function(req, res)
		{
			apiUtil.findMapForRequest(req)
				.exec(function(err, map) {
					if (handleDbOp(req, res, err, map, 'map', permissions.canViewMap)) return;
					var mapLayer = map.layers.id(req.params.layerId);
					// check if found
					if (handleDbOp(req, res, false, mapLayer, 'map layer')) return;
					// only send if complete; or incomplete was requested 
					if (mapLayer.featureCollection && (mapLayer.featureCollection.status == config.DataStatus.COMPLETE ||
						url.parse(req.url, true).query.incomplete)) {
							res.send(prepareLayerResult(req, mapLayer, map));
					} else {
						res.send('map layer is incomplete', 403);
					}
				});
		};

		app.get('/api/map/s/:secretSlug/layer/:layerId', mapLayerGetRoute);
		app.get('/api/map/:slug/layer/:layerId', mapLayerGetRoute);

		// Updates options for a map layer
		var mapLayerPutRoute = function(req, res)
		{
			apiUtil.findMapForRequest(req)
				.exec(function(err, map) {
					if (handleDbOp(req, res, err, map, 'map', permissions.canAdminMap)) return;
					console.log('updating layer ' + req.body._id + ' for map '+map.slug);
					var mapLayer = map.layers.id(req.params.layerId);
					// check if found
					if (handleDbOp(req, res, false, mapLayer, 'map layer')) return;

					var cloneDefaults;
					if (!mapLayer.featureCollection || (mapLayer.featureCollection.defaults 
						&& mapLayer.layerOptions._id.toString() == mapLayer.featureCollection.defaults.toString())) {
							console.warn('Cloning defaults for new layerOptions');
							
							cloneDefaults = function(callback) {
								models.cloneLayerOptionsDefaults(mapLayer.featureCollection, function(err, clone) {
								if (handleDbOp(req, res, err, clone)) return;
									mapLayer.layerOptions = clone._id;
									map.save(function(err, map) {
										// TODO: Can this really not be simplified?
										Map.findById(map._id)
											.populate('layers.featureCollection')
											.populate('layers.layerOptions')
											.exec(function(err, map) {
												if (handleDbOp(req, res, err, map)) return;
												var mapLayer = map.layers.id(req.params.layerId);
												callback(false, mapLayer);
											});
									});
								});
							};

					} else {
						console.warn('Updating existing layerOptions');
						cloneDefaults = function(callback) { callback(false, mapLayer); }
					}

					cloneDefaults.call(mapLayer.featureCollection, function(err, mapLayer) {
						if (handleDbOp(req, res, err, true)) return;

						// set all public elements of layerOptions
						for (var k in req.body.layerOptions) {
							if (k[0] != '_') {
								//console.log(k, req.body.layerOptions[k]);
								mapLayer.layerOptions.set(k, req.body.layerOptions[k]);
							}
						}

						mapLayer.layerOptions.save(function(err, opts) {
							if (handleDbOp(req, res, err, true)) return;

							console[console.success ? 'success' : 'info']('layerOptions updated');
							
							if (req.body.position != undefined) {
								var newPosition = parseInt(req.body.position);
								if (!isNaN(newPosition)) {
									var newIndex = newPosition < 0 ? 0 : newPosition >= map.layers.length ? map.layers.length : newPosition,
										sortedLayers = sortByPosition(map.layers),
										oldIndex = sortedLayers.indexOf(mapLayer),
										layerIds = sortedLayers.map(function(obj) { return obj._id });
									var setIndex = function(arr, oldIndex, newIndex) { arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]); };
									setIndex(layerIds, oldIndex, newIndex);
									for (var j = 0; j < layerIds.length; j++) {
										map.layers.id(layerIds[j]).set('position', j);
										//console.log(map.layers.id(layerIds[j]).featureCollection.title, map.layers.id(layerIds[j]).position);
									}
									map.save(function(err, map) {
										if (!handleDbOp(req, res, err, true)) {
											console.log('layer position set to ' + newPosition);
											res.send(prepareLayerResult(req, mapLayer, map));
										}
									});
									return;
								}
							}

							res.send(prepareLayerResult(req, mapLayer, map));
						});
					});
				});
		};

		app.put('/api/map/s/:secretSlug/layer/:layerId', mapLayerPutRoute);
		app.put('/api/map/:slug/layer/:layerId', mapLayerPutRoute);

		// Creates a new map layer from a point collection
		var mapLayerPostRoute = function(req, res)
		{
			if (!req.body.featureCollection) {
				res.send('no feature collection specified', 403);
			}
			apiUtil.findMapForRequest(req)
				.exec(function(err, map) {
					if (handleDbOp(req, res, err, map, 'map', permissions.canAdminMap)) return;
					GeoFeatureCollection.findOne({_id: req.body.featureCollection._id, $or: [{active: true}, 
						// TODO: check ownership instead of (unreliably) checking for status
						{status: {$in: [config.DataStatus.IMPORTING]}}]})
						.populate('defaults')
						.exec(function(err, collection) {
							if (handleDbOp(req, res, err, collection, 'collection')) return;


							if (!collection.defaults) {
								console.warn('Creating new layerOptions');
								getDefaults = function(callback) {
									// TODO: the GeoFeatureCollection has no defaults, due to a bug.
									// create new:
									models.cloneLayerOptionsDefaults(collection, callback);
								};
							} else {
								// Until overwritten by the user, the new layer will use the GeoFeatureCollection's
								// default settings.
								console.warn('Using defaults for layerOptions');
								getDefaults = function(callback) { callback(false, collection.defaults); }
							}

							getDefaults.call(collection, function(err, layerOptions) {
								var sortedLayers = sortByPosition(map.layers);
								var layer = {
									// set _id so it can be referenced below
									_id: new mongoose.Types.ObjectId(),
									featureCollection: collection,
									layerOptions: layerOptions,
									position: (sortedLayers.length ? 
										(sortedLayers[sortedLayers.length - 1].position != null ?
										sortedLayers[sortedLayers.length - 1].position + 1 : null) : 0)
								};    

								map.layers.push(layer);
								map.save(function(err, map) {
									if (handleDbOp(req, res, err, map)) return;
									console.log("map layer created");
									Map.findOne({_id: map._id})
										.populate('layers.featureCollection')
										.populate('layers.layerOptions')
										.exec(function(err, map) {
											if (handleDbOp(req, res, err, map)) return;
											res.send(prepareLayerResult(req, map.layers.id(layer._id), map));
										});
								});
							});

						});
				});
		};

		app.post('/api/map/s/:secretSlug/layer', mapLayerPostRoute);
		app.post('/api/map/:slug/layer', mapLayerPostRoute);

		// Deletes a map layer from a map
		var mapLayerDeleteRoute = function(req, res)
		{
			apiUtil.findMapForRequest(req)
				.exec(function(err, map) {
					if (handleDbOp(req, res, err, map, 'map', permissions.canAdminMap)) return;
					var mapLayer = map.layers.id(req.params.layerId);
					if (mapLayer) {
						mapLayer.remove();
					}
					map.save(function(err) {
						if (handleDbOp(req, res, err, true)) return;
						console.log('map layer deleted');
						res.send({_id: mapLayer._id});
					});
				});
		};

		app.delete('/api/map/s/:secretSlug/layer/:layerId', mapLayerDeleteRoute);
		app.delete('/api/map/:slug/layer/:layerId', mapLayerDeleteRoute);
	}
};

module.exports = MapAPI;
