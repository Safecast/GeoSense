var config = require('../../config.js'),
	models = require("../../models.js"),
	permissions = require("../../permissions.js"),
	utils = require("../../utils.js"),
	url = require('url'),
	mongoose = require('mongoose'),
	_ = require('cloneextend');

var Point = models.Point,
	PointCollection = models.PointCollection,
	Map = models.Map,
	handleDbOp = utils.handleDbOp;

var PointAPI = function(app) 
{
	if (app) {
		app.get('/api/histogram/:pointcollectionid', function(req, res) {
			PointCollection.findOne({_id: req.params.pointcollectionid, active: true}, function(err, pointCollection) {
				if (!err && pointCollection) {
					collectionName = 'r_points_hist-' + config.HISTOGRAM_SIZES[0];
					var Model = mongoose.model(collectionName, new mongoose.Schema(), collectionName);
					var query = {'value.pointCollection': pointCollection.linkedPointCollection || pointCollection._id};
					console.log(query);
					Model.find(query, function(err, datasets) {
						if (err) {
							res.send('server error', 500);
							return;
						}
						values = [];
						for (var i = 0; i < datasets.length; i++) {
							var reduced = datasets[i].get('value');
							values[reduced.val.step] = reduced.count;
						}
						var histogram = []; 
						for (var step = 0; step < config.HISTOGRAM_SIZES[0]; step++) {
							histogram.push({
								x: step,
								y: values[step] ? values[step] : 0,
								val: 1 / config.HISTOGRAM_SIZES[0] * step * (pointCollection.maxVal - pointCollection.minVal) + pointCollection.minVal
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
				.run(function(err, pointCollection) {
					if (!err && pointCollection) {
						res.send(pointCollection);
					} else {
						res.send('collection not found', 404);
					}
				});
		});

		app.get('/api/pointcollections', function(req, res){
		  	PointCollection.find({active: true}, null, {sort: {'title': 1}}, function(err, datasets) {
		  		var sources = [];
		  		for (var i = 0; i < datasets.length; i++) {
		  			sources.push(datasets[i].toObject());
		  			// TODO: count
		  			//sources[i].fullCount = ;
		  		}
		    	res.send(sources);
			});
		});

		app.get('/api/mappoints/:mapid/:pointcollectionid', function(req, res) {

//			PointCollection.findOne({_id: req.params.pointcollectionid, active: true}, function(err, pointCollection) {
			Map.findOne({_id: req.params.mapid})
				.populate('layers.pointCollection')
				.populate('layers.options')
				.populate('createdBy')
				.populate('modifiedBy')
				.run(function(err, map) {
					if (handleDbOp(req, res, err, map, 'map', permissions.canViewMap)) return;
					var pointCollection, mapLayer;
					for (var i = map.layers.length - 1; i >= 0; i--) {
						if (map.layers[i].pointCollection._id == req.params.pointcollectionid) {
							mapLayer = map.layers[i];
							pointCollection = mapLayer.pointCollection;
							break;
						}
					}

					if (!err && pointCollection) {
						var urlObj = url.parse(req.url, true);
						var queryOptions = {},
							filterQuery = {};

						var zoom = parseInt(urlObj.query.z) || 0;
						if (isNaN(zoom) || zoom < 0) {
							zoom = 0;
						}
						if (zoom >= config.GRID_SIZES.length) {
							zoom = config.GRID_SIZES.length - 1;
						}
						var gridSize = config.GRID_SIZES[zoom];

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
						var reducedCollectionName = mapLayer.options.reduction ?
							'r_points_' + mapLayer.options.reduction
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


						if (mapLayer.options.queryOptions) {
							queryOptions = _.extend(_.clone(config.API_RESULT_QUERY_OPTIONS), 
								adjustKeys(mapLayer.options.queryOptions, reduce ? 'value' : null, 1));
						}

						if (mapLayer.options.filterQuery) {
							filterQuery = _.extend(filterQuery, 
								adjustKeys(mapLayer.options.filterQuery, reduce ? 'value' : null));
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

							console.log('*** querying "' + collectionName + '" for '+pointCollection.get('title'), pointQuery, queryOptions);

							if (!reduceKey) {
								PointModel.find(pointQuery, [], queryOptions, function(err, datasets) {
									if (handleDbOp(req, res, err, datasets)) return;

									for (var i = 0; i < datasets.length; i++) {
										if (PointModel != Point) {
											var reduced = datasets[i].get('value');
											var p = {
												val: reduced.val,
												altVal: reduced.altVal,
												count: reduced.count,
												datetime: reduced.datetime,
												loc: [reduced.loc[0], reduced.loc[1]],
												label: reduced.label,
												extra: reduced.extra
											};
										} else {
											var p = {
												val: datasets[i].get('val'),
												altVal: datasets[i].get('altVal'),
												count: 1,
												datetime: datasets[i].get('datetime'),
												loc: datasets[i].get('loc'),
												label: datasets[i].get('label'),
												extra: datasets[i].get('extra')
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
								console.log('----------->', reduceKey, collectionName);
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
								PointModel = mongoose.model(collectionName, new mongoose.Schema(), collectionName);
								//pointQuery = {'value.pointCollection': mongoose.Types.ObjectId(req.params.pointcollectionid)};
								pointQuery = {'value.pointCollection': pointCollection.linkedPointCollection || pointCollection._id};
								pointQuery = _.extend(pointQuery, filterQuery);

								dequeueBoxQuery();
							} else {
								if (pointCollection.get('reduce') && !pointCollection.get('gridSize')) {
									collectionName = 'points';
									PointModel = Point;
									pointQuery = {'pointCollection': req.params.pointcollectionid};
								} else {
									collectionName = 'r_points_loc-0';
									PointModel = mongoose.model(collectionName, new mongoose.Schema(), collectionName);
									pointQuery = {'value.pointCollection': pointCollection.linkedPointCollection || pointCollection._id};
								}
								dequeueBoxQuery();
							}
						});


					} else {
						res.send('collection not found', 404);
					}
				});
		});
	}
};

module.exports = PointAPI;



///////////////
// POINTS 
///////////////

// broken and currently unused


/*
app.get('/api/points', function(req, res){
  Point.find(function(err, datasets) {
     res.send(datasets);
  });
});

app.get('/api/point/:id', function(req, res){
  Point.findById(req.params.id, function(err, data) {
    if (!err) {
       res.send(data);
    } else
	{point
		res.send("oops",500);
	}
  });
});

app.put('/api/point/:id', function(req, res){
  Point.findById(req.params.id, function(err, point) {
	
	point.collectionid 	= req.body.collectionid;
    point.name 			= req.body.name;
    point.location 		= req.body.location;
	point.lat 			= req.body.lat;
	point.lon 			= req.body.lon;
	point.val		 	= req.body.val;
	point.color		 	= req.body.color;

    point.save(function(err) {
		if (!err) {
      		res.send(point);
		}
		else
		{
			res.send('ooops', 500);
		}
    });
  });
});

app.post('/api/point', function(req, res){
  var point;
  point = new Point({
	collectionid: 		req.body.collectionid,
    name: 		req.body.name,
	location: 	req.body.location,
	lat: 		req.body.lat,
	lon: 		req.body.lon,
	val: 		req.body.val,
	color:      req.body.color 
  });
  point.save(function(err) {
    if (!err) {
	 	res.send(point);
    } else
	{
		res.send('oops', 500);
	}
  });
});

app.delete('/api/point/:id', function(req, res){
  return Point.findById(req.params.id, function(err, point) {
    return point.remove(function(err) {
		if (!err) {
        	console.log("removed");
        	res.send('')
      	} else
		{
			res.send('oops', 500);
		}
    });
  });
});
*/

/*
app.get('/api/collection/distinct' , function(req, res){
		
	Point.collection.distinct("collectionid", function(err, data){
		if (!err) {
			res.send(data);
		} else
		{
			res.send("oops",500);
		}
	  });
});

app.get('/api/collection/:id', function(req, res){
	
	Point.find({collectionid:req.params.id}, function(err, point) {
		if (!err) {
			res.send(point);
		}
		else
		{
			res.send('ooops', 500);
		}
  }).sort('date', 1);
});

app.get('/api/collection/', function(req, res){
	
	Point.find({collectionid:req.params.id}, function(err, point) {
		if (!err) {
			res.send(point);
		}
		else
		{
			res.send('ooops', 500);
		}
  });
});
*/

/*
app.post('/api/collection/:id', function(req, res){
		
	var point;
	  point = new Point({
		collectionid:  req.params.id,
	    name: 		req.body.name,
		location: 	req.body.location,
		lat: 		req.body.lat,
		lon: 		req.body.lon,
		val: 		req.body.val,
		color:      req.body.color 
	  });
	  point.save(function(err) {
	    if (!err) {
		 	res.send(point);
	    } else
		{
			res.send('oops', 500);
		}
	  });
});

*/

/*
app.post('/api/addpoints/:id', function(req, res){
		
	jsonObject = req.body.jsonpost;
	for(var i = 0; i < jsonObject.length; ++i)
	{	
		var point;	
		point = new Point({
			collectionid:  req.params.id,
		    label: 		jsonObject[i].label,
			loc: 		jsonObject[i].loc,
			val: 		jsonObject[i].val,
			datetime: 	jsonObject[i].datetime,
			created: 	jsonObject[i].created,
			modified: 	jsonObject[i].modified,
		  });	
				
		  point.save();
	}	
	res.send('');
});
*/

/*
app.delete('/api/collection/:id', function(req, res){
   Point.remove({collectionid:req.params.id}, function(err) {
      if (!err) {
        console.log("removed");
        res.send('')
      }
      else {
		res.send('oops error', 500);
	  }
  });
});
*/



/*
//Post a Point Collection
app.post('/api/pointcollection/:id/:name/:mapid/:maxval/:minval', function(req, res){
	
	var defaults = [{
		visible 	: 	req.body.jsonpost[0],
		featureType : 	req.body.jsonpost[1],
		colorHigh 	: 	req.body.jsonpost[2],
		colorLow 	: 	req.body.jsonpost[3],
		color 		: 	req.body.jsonpost[4],
		colorType 	: 	req.body.jsonpost[5],
	}];
	
	var collection;
	  collection = new PointCollection({
		collectionid: req.params.id,
	    name: req.params.name,
		mapid: req.params.mapid,
		maxval: req.params.maxval,
		minval: req.params.minval,
		defaults: defaults,
	  });
	  collection.save(function(err) {
	    if (!err) {
		 	res.send(collection);
	    } else
		{
			res.send('oops', 500);
		}
	  });
});
*/


//Delete a Post Collection
/*app.delete('/api/pointcollection/:id', function(req, res){
	
	PointCollection.remove({collectionid:req.params.id}, function(err) {
	      if (!err) {
	        console.log("removed pointcollection");
	        res.send('')
	      }
	      else {
			res.send('server error', 500);
		  }
	  });
});
*/
