var config = require('../../config.js'),
	models = require("../../models.js"),
	permissions = require("../../permissions.js"),
	utils = require("../../utils.js"),
	uuid = require('node-uuid'),
	md5 = require('MD5'),
	mongoose = require('mongoose'),
	_ = require('cloneextend');

var Point = models.Point,
	PointCollection = models.PointCollection,
	Map = models.Map,
	MapLayer = models.MapLayer,
	LayerOptions = models.LayerOptions,
	User = models.User,
	handleDbOp = utils.handleDbOp;

var MapAPI = function(app) 
{
	if (app) {
		// Returns a list of maps
		app.get('/api/maps(\/latest|\/featured)' , function(req, res){
			var query = {status: config.MapStatus.PUBLIC};
			var options = {};
			switch (req.params[0]) {
				case '/latest':
					options.sort = {'createdAt': -1};
					options.limit = 20;		
					break;
				case '/featured':
					if (!config.DEBUG) {
						query.featured = {$gt: 0};
					}
					options.sort = {'featured': -1};
					break;
			}
			Map.find(query, null, options)
				.run(function(err, maps) {
					if (handleDbOp(req, res, err, maps)) return;
					var preparedMaps = [];
					for (var i = 0; i < maps.length; i++) {
						preparedMaps[i] = prepareMapResult(req, maps[i]);			
					}
					res.send(preparedMaps);
				});
		});

		//Returns the collections associated with a unique map by map _id
		/*
		app.get('/api/maps/:mapid' , function(req, res){
			
			PointCollection.find({_id : req.params.mapid}, function(err, data){
				if (!err) {
					res.send(data);
				} else
				{
					res.send("oops",500);
				}
			});
		});
		*/

		function prepareMapResult(req, map) {
			map.adjustScales();
			var m = {
				admin: permissions.canAdminMap(req, map)
			};
			var obj = map.toObject();
			for (var k in obj) {
				if (m.admin || (k != 'email' && k != 'adminslug')) {
					m[k] = obj[k];
				}
				if (k == 'layers') {
					for (var i = 0; i < m[k].length; i++) {
						delete m[k][i].pointCollection.importParams;
					}
					// TODO: Deprecated conversion to 'collections'
					m['collections'] = [];
					for (var i = 0; i < obj[k].length; i++) {
						m['collections'].push({
							options: obj[k][i].options,
							collectionid: obj[k][i].pointCollection._id
						});
					}
				}
			}
			return m;
		}

		// Returns a specific map by publicslug
		app.get('/api/map/:publicslug', function(req, res){
			Map.findOne({publicslug: req.params.publicslug})
				.populate('layers.pointCollection')
				.populate('layers.options')
				.populate('createdBy')
				.populate('modifiedBy')
				.run(function(err, map) {
					if (handleDbOp(req, res, err, map, 'map', permissions.canViewMap)) return;
					console.log(map);
			       	res.send(prepareMapResult(req, map));
				});
		});

		// Returns a specific map by adminslug, and sets its admin state to true for current 
		// session
		app.get('/api/map/admin/:adminslug', function(req, res) {	
			Map.findOne({adminslug: req.params.adminslug})
				.populate('layers.pointCollection')
				.populate('layers.options')
				.populate('createdBy')
				.populate('modifiedBy')
				.run(function(err, map) {
					if (handleDbOp(req, res, err, map, 'map')) return;
					permissions.canAdminMap(req, map, true);
					req.session.user = map.createdBy;
			       	res.send(prepareMapResult(req, map));
				});
		});

		// Creates and returns a new map
		app.post('/api/map', function(req, res)
		{
			if (!permissions.canCreateMap(req)) {
	            res.send('', 403);
	            return;
			}

			var currDate = Math.round((new Date).getTime() / 1000);
			var collections = {};
			var slugCounter = 1;

			var map = new Map({
				title: req.body.title,
				description: '',
				adminslug: new Buffer(uuid.v4(), 'hex').toString('base64'),
				collections: collections,
			});	

			map.createdBy = map.modifiedBy = req.session.user;

			var makeUniqueSlugAndSave = function() 
			{
				map.publicslug = utils.slugify(req.body.title) + (slugCounter > 1 ? '-' + slugCounter : '');
				if (map.publicslug.match(config.RESERVED_URI)) {
					slugCounter++;
					makeUniqueSlugAndSave();
					return;
				}
			    console.log('post new map, looking for existing slug "'+map.publicslug+'"')
				Map.findOne({publicslug: map.publicslug}, function(err, existingMap) {
					if (handleDbOp(req, res, err, true)) return;
					if (existingMap) {
						console.log('publicslug "' + map.publicslug + '" exists, increasing counter');
						slugCounter++;
						makeUniqueSlugAndSave();
					} else {
						console.log('saving map')
						map.save(function(err, map) {
							if (handleDbOp(req, res, err, map, 'map')) return;
							permissions.canAdminMap(req, map, true);
						 	res.send(prepareMapResult(req, map));
						});
					}
				});
			}

			makeUniqueSlugAndSave();
		});

		// Updates a map 
		app.put('/api/map/:publicslug', function(req, res)
		{
			Map.findOne({publicslug: req.params.publicslug})
				.populate('layers.pointCollection')
				.populate('layers.options')
				.populate('createdBy')
				.populate('modifiedBy')
				.run(function(err, map) {
					if (handleDbOp(req, res, err, map, 'map', permissions.canAdminMap)) return;

					var fields = ['title', 'description', 'author', 
						'linkURL', 'twitter', 'initialArea', 'displayInfo', 'host'];

					for (var i = fields.length - 1; i >= 0; i--) {
						var f = req.body[fields[i]];
						if (f != undefined) {
							map[fields[i]] = f;
						}
					}

					if (map.host && map.host != '') {
						var split = map.host.split('://');
						map.host = split.pop();
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

					email = req.body['createdBy.email'];
					var prevEmail = req.body.createdBy ? req.body.createdBy.email : null;

					if (email && email != '' && (!map.createdBy || map.createdBy.email != email)) {
						var user;
						if (map.createdBy) {
							user = map.createdBy;
						} else {
							user = new User();
						}				
						user.email = email;
						user.save(function(err, user) {
							if (err && err.errors.email) {
								err.errors.email.path = 'createdBy.email';
							}
							if (handleDbOp(req, res, err, user, 'user')) return;
							map.createdBy = map.modifiedBy = user;
							map.save(function(err, map) {
								if (handleDbOp(req, res, err, map, 'map')) return;
								console.log('map updated');

								// find again since createdBy and modifiedBy won't be populated after map.save()
								Map.findOne({_id: req.params.mapid})
									.populate('layers.pointCollection')
									.populate('layers.options')
									.populate('createdBy')
									.populate('modifiedBy')
									.run(function(err, map) {
										if (handleDbOp(req, res, err, map, 'map')) return;
									 	res.send(prepareMapResult(req, map));
									 	if (prevEmail != user.email && config.SMTP_HOST) {
											console.log('emailing info to user');
										 	utils.sendEmail(user.email, 'Your map URLs', 'urls', {
										 		adminUrl: config.BASE_URL + 'admin/' + map.adminslug,
										 		publicUrl: config.BASE_URL + map.publicslug
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
							console.log('map updated');
						 	res.send(prepareMapResult(req, map));
						});
					}
			  	});
		});

		// Deletes a map
		app.delete('/api/map/:publicslug', function(req, res)
		{
			Map.findOne({publicslug: req.params.publicslug})
				.populate('layers.pointCollection')
				.populate('layers.options')
				.run(function(err, map) {
					if (handleDbOp(req, res, err, map, 'map', permissions.canAdminMap)) return;

					while (map.layers.length > 0) {
						map.layers[0].options.remove();
						map.layers[0].remove();
					}

					map.remove(function(err) {
						if (err) {
							res.send('server error', 500);
							return;
						}
						console.log('map removed');
						res.send('');
					});
			  	});
		});

		// Updates options for a map layer
		app.put('/api/map/:publicslug/layer/:layerId', function(req, res)
		{
			Map.findOne({publicslug: req.params.publicslug})
				.populate('layers.pointCollection')
				.populate('layers.options')
				.run(function(err, map) {
					if (handleDbOp(req, res, err, map, 'map', permissions.canAdminMap)) return;

					console.log('updating layer ' + req.body._id + ' for map '+map.publicslug);

					var options = req.body.options;

					var colors = req.body.options.colors;
					if (!Array.isArray(colors)) {
						colors = [];
					}

					for (var i = 0; i < colors.length; i++) {
						var c = colors[i];
						c.position = c.position.match(/^[0-9]+(\.[0-9]+)?%?$/) ?
							c.position : '0%';
						c.color = c.color.match(/^#([a-fA-F0-9]{2}){3}$/) ?
							c.color : '#000000';
					}
					// sort by position
					colors.sort(function(a, b) { return (a.position - b.position) });
					options.colors = colors;

					for (var i = 0; i < map.layers.length; i++) {
						if (map.layers[i]._id.toString() == req.params.layerId) {
							for (var k in options) {
								map.layers[i].options[k] = options[k];
							}
							map.layers[i].options.save(function(err) {
								// prefix validation errors from 'options' field
								if (err && err.name == 'ValidationError') {
									var patchedErrors = {};
									for (var k in err.errors) {
										patchedErrors['options.' + k] = _.cloneextend(err.errors[k], {
											path: 'options.' + err.errors[k].path
										});
									}
									err.errors = patchedErrors;
								}
								// if no error, return layer
								if (!handleDbOp(req, res, err, true)) {
									console.log('layer options updated', options);
									res.send(map.layers[i]);
								}
							});
							return;
						}
					}

					res.send('collection not bound', 409);
					return;
			  	});
		});

		// Creates a new map layer from a point collection
		app.post('/api/map/:publicslug/layer', function(req, res)
		{
			Map.findOne({publicslug: req.params.publicslug})
				.populate('layers.pointCollection')
				.run(function(err, map) {
					if (handleDbOp(req, res, err, map, 'map', permissions.canAdminMap)) return;

					for (var i = 0; i < map.layers.length; i++) {
						if (map.layers[i].pointCollection._id.toString() == req.body.pointCollectionId) {
							res.send('collection already bound', 409);
							return;
						}
					}

				    PointCollection.findOne({_id: req.body.pointCollectionId, $or: [{active: true}, 
				    	{status: {$in: [config.DataStatus.IMPORTING]}}]})
				    	.populate('defaults')
				    	.run(function(err, collection) {
							if (handleDbOp(req, res, err, collection, 'collection')) return;

						    var defaults = collection.defaults.toObject();
						    delete defaults['_id'];
						    var options = new LayerOptions(defaults);

						    options.save(function(err) {
							    if (err) {
									res.send('server error', 500);
									return;
								}
							    var layer = new MapLayer({
							    	_id: new mongoose.Types.ObjectId(),
							    	pointCollection: collection,
							    	options: options._id
							    });    
							    console.log(layer);

						      	map.layers.push(layer);
						      	map.save(function(err, map) {
						      		console.log(err);
									if (err) {
										res.send('server error', 500);
										return;
									}
							        console.log("collection bound to map");
									Map.findOne({_id: map._id})
										.populate('layers.pointCollection')
										.populate('layers.options')
										.run(function(err, map) {
										    if (!err) {
										       	res.send(prepareMapResult(req, map));
										    } else {
												res.send('server error', 500);
											}
										});
							  	});
						    });
					    });
			    });
		});

		// Deletes a map layer from a map
		app.delete('/api/map/:publicslug/layer/:layerId', function(req, res)
		{
			Map.findOne({publicslug: req.params.publicslug})
				.populate('layers.pointCollection')
				.populate('layers.options')
				.run(function(err, map) {
					if (handleDbOp(req, res, err, map, 'map', permissions.canAdminMap)) return;

					for (var i = 0; i < map.layers.length; i++) {
						if (map.layers[i]._id.toString() == req.params.layerId) {
							map.layers[i].options.remove();
							map.layers[i].remove();
							break;
						}
					}
					map.save(function(err) {
						if (err) {
							res.send('server error', 500);
							return;
						}
						console.log('map layer deleted');
						res.send('');
					});
			  	});
		});
	}
};

module.exports = MapAPI;
