var config = require('../config.js'),
	models = require("../models.js"),
	permissions = require("../permissions.js"),
	utils = require("../utils.js"),
	uuid = require('node-uuid'),
	md5 = require('MD5');

var Point = models.Point,
	PointCollection = models.PointCollection,
	Map = models.Map,
	MapLayer = models.MapLayer,
	LayerOptions = models.LayerOptions,
	User = models.User,
	handleDbOp = utils.handleDbOp;

var MapAPI = function(app) {

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

	//Returns a specific map by publicslug
	app.get('/api/map/:publicslug', function(req, res){
		Map.findOne({publicslug: req.params.publicslug})
			.populate('layers.pointCollection')
			.populate('layers.options')
			.populate('createdBy')
			.populate('modifiedBy')
			.run(function(err, map) {
				if (handleDbOp(req, res, err, map, 'map', permissions.canViewMap)) return;
		       	res.send(prepareMapResult(req, map));
			});
	});

	//Returns a specific map by adminslug, and sets its admin state to true for current 
	//session
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

	//Creates and returns a new map
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

	app.post('/api/bindmapcollection/:mapid/:pointcollectionid', function(req, res){
		
	    var pointcollectionid = req.params.pointcollectionid;

		Map.findOne({_id: req.params.mapid})
			.populate('layers.pointCollection')
			.run(function(err, map) {
				if (handleDbOp(req, res, err, map, 'map', permissions.canAdminMap)) return;

				for (var i = 0; i < map.layers.length; i++) {
					if (map.layers[i].pointCollection._id.toString() == pointcollectionid) {
						res.send('collection already bound', 409);
						return;
					}
				}

			    PointCollection.findOne({_id: pointcollectionid, $or: [{active: true}, 
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
						    	pointCollection: collection,
						    	options: options._id
						    });    

					      	map.layers.push(layer);
					      	map.save(function(err, map) {
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

	app.post('/api/updatemapcollection/:mapid/:pointcollectionid', function(req, res){
		
	    var collectionid = req.params.pointcollectionid;

		Map.findOne({_id: req.params.mapid})
			.populate('layers.pointCollection')
			.populate('layers.options')
			.run(function(err, map) {
				if (handleDbOp(req, res, err, map, 'map', permissions.canAdminMap)) return;

				var options = {
					visible : Boolean(req.body.visible),
					featureType : String(req.body.featureType),
					colorType: String(req.body.colorType),
					opacity: Number(req.body.opacity) || null
				};

				var colors = req.body.colors;

				for (var i = 0; i < colors.length; i++) {
					var c = colors[i];
					if (c.position || options.colorType != config.ColorType.SOLID) {
						c.position = Number(c.position) || 0.0;
					}
				}
				// sort by position
				colors.sort(function(a, b) { return (a.position - b.position) });
				options.colors = colors;

				for (var i = 0; i < map.layers.length; i++) {
					if (map.layers[i].pointCollection._id.toString() == collectionid) {
						for (var k in options) {
							map.layers[i].options[k] = options[k];
						}
						map.layers[i].options.save(function(err) {
							if (err) {
								res.send('server error', 500);
								return;
							}
							console.log('layer options updated');
							res.send(map.layers[i]);
						});
						return;
					}
				}

				res.send('collection not bound', 409);
				return;
		  	});
	});

	app.post('/api/unbindmapcollection/:mapid/:collectionid', function(req, res){
	    var collectionid = String(req.params.collectionid);
		
		Map.findOne({_id: req.params.mapid})
			.populate('layers.pointCollection')
			.populate('layers.options')
			.run(function(err, map) {
				if (handleDbOp(req, res, err, map, 'map', permissions.canAdminMap)) return;

				for (var i = 0; i < map.layers.length; i++) {
					if (map.layers[i].pointCollection._id.toString() == collectionid) {
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
					console.log('map updated');
					res.send('');
				});
		  	});
	});

	app.post('/api/map/:mapid', function(req, res){
		Map.findOne({_id: req.params.mapid})
			.populate('layers.pointCollection')
			.populate('layers.options')
			.populate('createdBy')
			.populate('modifiedBy')
			.run(function(err, map) {
				if (handleDbOp(req, res, err, map, 'map', permissions.canAdminMap)) return;

				var fields = ['title', 'description', 'author', 
					'url', 'twitter', 'initialArea', 'displayInfo'];

				for (var i = fields.length - 1; i >= 0; i--) {
					var f = req.body[fields[i]];
					if (f != undefined) {
						map[fields[i]] = f;
					}
				}

				if (map.url && map.url != '') {
					var split = map.url.split('://');
					map.url = split.pop();
					map.url = (split.length ? split.pop() : 'http') + '://' + map.url;
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

	app.delete('/api/map/:mapid', function(req, res){
		Map.findOne({_id: req.params.mapid})
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

};

module.exports = MapAPI;
