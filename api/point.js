var config = require('../config.js'),
	models = require("../models.js"),
	permissions = require("../permissions.js"),
	utils = require("../utils.js"),
	url = require('url'),
	mongoose = require('mongoose');

var Point = models.Point,
	PointCollection = models.PointCollection,
	handleDbOp = utils.handleDbOp;

var PointAPI = function(app) 
{
	if (app) {
		app.get('/api/histogram/:pointcollectionid', function(req, res) {
			PointCollection.findOne({_id: req.params.pointcollectionid, active: true}, function(err, pointCollection) {
				if (!err && pointCollection) {
					collectionName = 'r_points_hist-' + config.HISTOGRAM_SIZES[0];
					var Model = mongoose.model(collectionName, new mongoose.Schema(), collectionName);
					var query = {'value.pointCollection': mongoose.Types.ObjectId(req.params.pointcollectionid)};
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

		app.get('/api/mappoints/:pointcollectionid', function(req, res) {

			PointCollection.findOne({_id: req.params.pointcollectionid, active: true}, function(err, pointCollection) {
				if (!err && pointCollection) {
					var urlObj = url.parse(req.url, true);

					zoom = urlObj.query.z || 0;
					grid_size = config.GRID_SIZES[zoom];
					console.log('zoom ' + zoom + ', grid size ' + grid_size);

					var time_grid = false;
					switch (urlObj.query.t) {
						case 'y':
							time_grid = 'yearly';
							break;
						case 'w':
							time_grid = 'weekly';
							break;
						case 'd':
							time_grid = 'daily';
							break;
					}

					var reduce = pointCollection.get('reduce');
					var collectionName;
					var pointQuery;
					var boxes;

					if (urlObj.query.b && urlObj.query.b.length == 4) {
						var b = urlObj.query.b;
						console.log('bounds:');	
						console.log(b);

						for (var i = 0; i < 4; i++) {
							b[i] = parseFloat(b[i]) || 0;
						}

						// Mongo currently doesn't handle the transition around the dateline (x = +-180)
						// This, if the bounds contain the dateline, we need to query for the box to 
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

						console.log('query within boxes: '+boxes.length);
						console.log(boxes);
					}

					var PointModel;
					var points = [];
					var queryExecuted = false; 
					var originalCount = 0;
					var maxCount = 0;
					var fullCount;

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
								maxCount: maxCount,
								gridSize: grid_size,
								items: points
							};
							res.send(data);
							return;
						}

						console.log('querying "' + collectionName + '" for '+pointCollection.get('title'));

						if (boxes) {
							var box = boxes.shift();
							pointQuery[PointModel != Point ? 'value.loc' : 'loc'] = {$within: {$box : box}};
						}

						if (!time_grid) {
							PointModel.find(pointQuery, function(err, datasets) {
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
											label: reduced.label
										};
									} else {
										var p = {
											val: datasets[i].get('val'),
											altVal: datasets[i].get('altVal'),
											count: 1,
											datetime: datasets[i].get('datetime'),
											loc: datasets[i].get('loc'),
											label: datasets[i].get('label')
										};
									}
									points.push(p);
									originalCount += p.count;
									maxCount = Math.max(maxCount, p.count);
								}
								queryExecuted = true;
								dequeueBoxQuery();
							});
						} else {
							var command = {
								mapreduce: collectionName,
								query: pointQuery,
								map: function() {
									//var epoch = new Date(this.value.datetime).getTime() / 1000;
									emit(this.value.datetime, {
										val: this.value.val.sum,
										count: this.value.val.count,
										datetime: this.value.datetime
									});
								}.toString(),
								reduce: function(key, values) {
									var result = {
										val: 0,
										count: 0,
										datetime: values[0].datetime
									};
									values.forEach(function(value) {
										result.val += value.val;
										result.count += value.count;
									});
									return result;
								}.toString(),
								finalize: function(key, value) {
									value.val /= value.count;
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
									maxCount = Math.max(maxCount, p.count);
								}
								queryExecuted = true;
								dequeueBoxQuery();
							});
						}
					}

					utils.modelCount(Point, {'pointCollection': req.params.pointcollectionid}, function(err, c) {
						fullCount = c;
						// TODO: should count points in all boxes and not reduce if < 1000
						reduce = reduce && zoom < 14;
						if (reduce) {
							collectionName = 'r_points_loc-'+grid_size+(time_grid ? '_' + time_grid : '');
							PointModel = mongoose.model(collectionName, new mongoose.Schema(), collectionName);
							pointQuery = {'value.pointCollection': mongoose.Types.ObjectId(req.params.pointcollectionid)};
							dequeueBoxQuery();
						} else {
							if (pointCollection.get('reduce')) {
								collectionName = 'points';
								PointModel = Point;
								pointQuery = {'pointCollection': req.params.pointcollectionid};
							} else {
								collectionName = 'r_points_loc-0';
								PointModel = mongoose.model(collectionName, new mongoose.Schema(), collectionName);
								pointQuery = {'value.pointCollection': mongoose.Types.ObjectId(req.params.pointcollectionid)};
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
