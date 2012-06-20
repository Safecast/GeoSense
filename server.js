
/*var Proj4js = require('proj4js');
var METERS_PER_DEG_LON = Proj4js.transform(new Proj4js.Proj("EPSG:4326"), new Proj4js.Proj("EPSG:900913"), new Proj4js.Point(1, 0)).x;
var METERS_PER_PX_AT_ZOOM_0 = 156543.03390625;
var DEG_PER_PX_AT_ZOOM_0 = METERS_PER_DEG_LON / METERS_PER_PX_AT_ZOOM_0;*/

var config = require("./public/config.js");

var DEG_PER_PX_AT_ZOOM_0 = 0.7111111112100985
var GRID_SIZES = {
//	'-1': 2,
	'0': DEG_PER_PX_AT_ZOOM_0 * 4
};
for (var zoom = 1; zoom <= 15; zoom++) {
	GRID_SIZES[zoom] = GRID_SIZES[zoom - 1] / 2;
}

var DataStatus = {
	IMPORTING: 'I',
	REDUCING: 'R',
	DONE: 'D'
};

var COLLECTION_DEFAULTS = {
	visible: true,
	featureType: 'C',
	colorType: 'S',
	colors: [{color: '#00C9FF'}],
	opacity: null
};

var HISTOGRAM_STEPS = 100;

//var profiler = require('v8-profiler');

var application_root = __dirname,
  	express = require("express"),
  	path = require("path"),
  	mongoose = require('mongoose'),
  	twitter = require('ntwitter'),
	//nowjs = require("now"),
	csv = require('csv'),    
	date = require('datejs'),
	url = require('url'),
	util = require('util'),
	_ = require('cloneextend');

var app = express.createServer();

//local
if(process.env.NODE_ENV == 'development')
{
	db_path = 'mongodb://localhost/geo';
}
else if (process.env.NODE_ENV == 'production')
{
	db_path = 'mongodb://safecast:quzBw0k@penny.mongohq.com:10065/app4772485'
}

//production
console.log(db_path);
mongoose.connect(db_path);

app.configure(function(){
	app.use(express.static(__dirname + '/public'));
	app.use(express.logger('dev'));
 	app.use(express.bodyParser());
	app.use(express.methodOverride());
  	app.use(app.router);
  	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  	app.set('views', path.join(application_root, "views"));
});


/*
var zlib = require('zlib');
var http = require('http');
var fs = require('fs');
function compressResponse(request, response, data) {	
  var acceptEncoding = request.headers['accept-encoding'];
  if (!acceptEncoding) {
    acceptEncoding = '';
  }

  // Note: this is not a conformant accept-encoding parser.
  // See http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
  if (acceptEncoding.match(/\bdeflate\b/)) {
    response.writeHead(200, { 'content-encoding': 'deflate' });
    data.pipe(zlib.createDeflate()).pipe(response);
  } else if (acceptEncoding.match(/\bgzip\b/)) {
    response.writeHead(200, { 'content-encoding': 'gzip' });
    data.pipe(zlib.createGzip()).pipe(response);
  } else {
    response.writeHead(200, {});
    data.pipe(response);
  }
}
*/


////////////////
// CHAT SERVER
////////////////
// var everyone = nowjs.initialize(app);

// // Send message to everyone on the users group
// everyone.now.distributeMessage = function(message){
//     var group = nowjs.getGroup(this.now.serverRoom);
//     console.log(group);
//     console.log('******************** distribute '+message);
//     group.now.receiveMessage(this.now.name, message);
// };

// everyone.now.joinRoom = function(newRoom){
//     var newGroup = nowjs.getGroup(newRoom);
//     console.log(this.user);
//     console.log('-----------------'+this.user.clientId+' joined '+newRoom);
//     newGroup.addUser(this.user.clientId);
//     //newGroup.now.receiveMessage('New user joined the room', this.now.name);
//     this.now.serverRoom = newRoom;
// };

/////////////////
// STATIC ROUTES
////////////////

//Admin Route

app.get(/^\/[a-zA-Z0-9]{15}(|\/setup)(|\/globe)(|\/map)(|\/)(|\/?)$/, function(req, res){
   res.sendfile('public/index.html');
});

//View Route
app.get(/^\/[a-zA-Z0-9]{10}(|\/globe)(|\/map)$/, function(req, res){
   res.sendfile('public/index.html');
});

///////////
// DATA API
///////////

//Models 

var Point = mongoose.model('Point', new mongoose.Schema({
	pointCollection: { type: mongoose.Schema.ObjectId, ref: 'PointCollection', required: true, index: 1 },
	collectionid: String, 
	loc: {type: [Number], index: '2d', required: true},
	val: {type: Number, index: 1},
	altVal: [mongoose.Schema.Types.Mixed],
	label: String,
	url: String,
	datetime: {type: Date, index: 1},
	created: Date,
	modified: Date,	
}));

Point.schema.index({loc: '2d', pointCollection: 1})

var LayerOptions = mongoose.model('LayerOptions', new mongoose.Schema({
	visible: Boolean,
	featureType: String,
	colorType: String,
	colors: [{
		color: {type: String, required: true},
		position: Number,
		interpolation: String
	}],
	opacity: Number,
	datetimeFormat: String,
	valFormat: String,
	altValFormat: [String],
}));

var PointCollection = mongoose.model('PointCollection', new mongoose.Schema({
	title: String,
	description: String,
	unit: String,
	altUnit: [String],
	maxVal: Number,
	minVal: Number,
	timeBased: Boolean,
	created: Date, 
	modified: Date,
	created_by: String,
	modified_by: String,
	defaults: { type: mongoose.Schema.ObjectId, ref: 'LayerOptions', index: 1 },
	active: Boolean,
	status: String,
	progress: Number,
	numBusy: Number,
	reduce: Boolean,
}));

var MapLayer = mongoose.model('MapLayer', new mongoose.Schema({
	pointCollection: { type: mongoose.Schema.ObjectId, ref: 'PointCollection', index: 1 },
	options: { type: mongoose.Schema.ObjectId, ref: 'LayerOptions', index: 1 },
}));

var Map = mongoose.model('Map', new mongoose.Schema({
	title: String,
	description: String,
	adminslug: String,
	publicslug: String,
	created: Date,
	modified: Date,
	created_by: String,
	modified_by: String,
	layers: {type: [MapLayer.schema], index: 1}
}));

var Tweet = mongoose.model('Tweet', new mongoose.Schema({
	collectionid: String,
	mapid: String,
}));

var TweetCollection = mongoose.model('TweetCollection', new mongoose.Schema({
	collectionid: String,
	mapid: String,
	name: String,
}));

var Chat = mongoose.model('Chat', new mongoose.Schema({
	mapid: String,
	name: String,
	text: String,
	date: Date,
}));

var Comment = mongoose.model('Comment', new mongoose.Schema({
	commentid: Number,
	mapid: String,
	name: String,
	text: String,
	date: Date,
}));


// TODO: Due to a mongodb bug, counting is really slow even if there is 
// an index: https://jira.mongodb.org/browse/SERVER-1752
// To address this we currently cache the count as long for 
// as the server is running, but mongodb 2.3 should fix this issue.
var COUNT_CACHE = {};
function modelCount(model, query, callback) {
	console.log('counting', query);

	cacheKey = model.modelName + '-';
	for (var k in query) {
		cacheKey += k + '-' + query[k];
	}

	if (!COUNT_CACHE[cacheKey]) {
		model.count(query, function(err, count) {
			if (!err) {
				COUNT_CACHE[cacheKey] = count;
			}			
			callback(err, count);
		});
	} else {
		console.log('cached count '+cacheKey+': '+COUNT_CACHE[cacheKey]);
		callback(false, COUNT_CACHE[cacheKey]);
	}
}


// Routes

/////////////////////
// DATA POST ROUTES 
////////////////////

app.post('/api/import/', function(req, res){

	// TODO: This only serves for testing
	if (!req.body['file']) {
		switch(req.body.converter) {
			case 'Earthquake Dataset':
				req.body['file'] = 'earthquakes.csv';
				break;
			
			case 'Nuclear Reactors':
				req.body['file'] = 'reactors.csv';
				break;
			
			case 'Safecast Dataset':
				req.body['file'] = 'measurements-out.csv';
				break;
		}
	}
	
	var file = req.body['file'];
	var path = '/public/data/' + req.body['file'];
	var type =  file.split('.').pop();

	var ConversionError = function() {};

	/**
	* Converts a string like ' y.yyy ,  -xx.x' to [x, y]
	*/	
	var latLngWithCommaFromString = function(field) {
		return function() {
			var match = String(this.get(field)).match(/^\s*([0-9\.\-]+)\s*,\s*([0-9\.\-]+)\s*$/);
			if (match) return [parseFloat(match[2]), parseFloat(match[1])];
			return new ConversionError();
		}
	};

	switch(req.body.converter) {
		
		case 'Standard (loc, val, date)':
			
			var converter = {
				fields: {
					val: function() {
						return parseFloat(this.get('val'));
					}
					,datetime: function() {
						var d = Date.parse(String(this.get('date')));
						return new Date(d);
					}
					,loc: function() {
						var loc = this.get('loc').split(' ');
						return [parseFloat(loc[1]), parseFloat(loc[0])];
					}
				}
			};
			
		break;
		
		case 'Earthquake Dataset':
		
			var converter = {
				fields: {
					val: function() {
						return parseFloat(this.get('mag'));
					}
					,datetime: function() {
						return new Date(this.get('year'), this.get('month') - 1, this.get('day'));
					}
					,loc: latLngWithCommaFromString('location')
				}
			};
		
		break;
		
		case 'Nuclear Reactors':
		
			var converter = {
				fields: {
					val: function() {
						return parseFloat(this.get('val'));
					}
					,datetime: function() {
						return new Date(String(this.get('year')));
					},
					label: function() {
						return this.get('Facility') + ' (' + this.get('ISO country code') + ')';
					}
					,loc: latLngWithCommaFromString('location')
				}
			};
			
		break;
		
		case 'Safecast Dataset':
		
			var converter = {
				fields: {
					val: function() {
						return parseFloat(this.get('value')) * (this.get('unit') == 'cpm' ? 1.0 : 350.0);
					}
					/*,altVal: function() {
						return [parseFloat(this.get('value'))] / (this.get('unit') == 'cpm' ? 350.0 : 1.0);
					}*/
					,datetime: function() {
						return new Date(this.get('captured_at'));
					}
					,loc: function() {
						//return [parseFloat(this.get('lng')), parseFloat(this.get('lat'))];
						// TODO: Temporarily switched due to invalid dump 
						return [parseFloat(this.get('lat')), parseFloat(this.get('lng'))];
					}
				}
			};
		
		break;
		
		default:
	}

	var clamp180 = function(deg) {
		if (deg < -360 || deg > 360) {
			deg = deg % 360;	
		} 
		if (deg < -180) {
			deg = 180 + deg % 180;
		}
		if (deg > 180) {
			deg = 180 - deg % 180;
		}
		if (deg == 180) {
			deg = -180;
		}

		return deg;
	};

	var importCount = 0;
	var fieldNames;
	var FIRST_ROW_IS_HEADER = true;
	var originalCollection = 'o_' + new mongoose.Types.ObjectId();
	var Model = mongoose.model(originalCollection, new mongoose.Schema({ any: {} }), originalCollection);
	var limitMax = 30000;
	var limitSkip = 0;
	var appendCollectionId = null;
	
	var convertOriginalToPoint = function(data, converters) {
		var doc = {};
		for (var destField in converters.fields) {
			var f = converters.fields[destField];
			doc[destField] = f.apply(data);
			if (doc[destField] instanceof ConversionError) {
				console.log('ConversionError on field '+destField);
				return false;
			} 
		}
		doc['loc'][0] = clamp180(doc['loc'][0]);
		doc['loc'][1] = clamp180(doc['loc'][1]);
		return new Point(doc);
	}

	var runImport = function(collection) {
		collection.active = false;
		collection.status = DataStatus.IMPORTING;

		collection.save(function(err, collection) {
		    if (!err) {
		    	var newCollectionId = collection.get('_id');
		    	console.log('saved PointCollection "'+collection.get('title')+'" = '+newCollectionId);
				var response = {
					'pointCollectionId': newCollectionId,
				};
				res.send(response);

				var maxVal, minVal;
				var numRead = 0;
				var numImport = 0;
				var numSaving = 0;
				var numDone = 0;
				var ended = false;
				var finalized = false;

				var finalize = function() {
					finalized = true;
			    	collection.maxVal = maxVal;
					collection.minVal = minVal;
					collection.active = true;
					collection.status = DataStatus.DONE;
					collection.reduce = numDone > 1000;
					collection.collectionid = collection.get('_id'); // TODO: deprecated
					collection.save(function(err) {
				    	debugStats('*** finalized and activated collection ***');
					});
				};

				var debugStats = function(pos) {
					console.log('* '+collection.get('_id')+' '+pos+' -- stats: numRead: ' + numRead + ', numSaving: '+numSaving + ', numDone: '+numDone);
				};

				function postSave(self) {
					if (numSaving == 0) {
						if (ended) {
							if (!finalized) {
								finalize();
							}
							return;
						}
				    	debugStats('resume');
				    	self.readStream.resume();
					}
				}

				function makeSaveHandler(point, self) {
					return function(err) {

						if (err) console.log('*** error', err);

						point = null;
						numSaving--;
						numDone++;
				    	debugStats('on save point');
				    	postSave(self);
					}
				}

				switch(type) {
					case 'csv':

						csv()
						    .fromPath(__dirname + path)
						    .transform(function(data){
						        data.unshift(data.pop());
						        return data;
						    })
						    .on('data',function(data, index) {
								if (ended) return;
								numRead++;
						    	debugStats('on data');
						    	var self = this;
						    	self.readStream.pause();
								if (FIRST_ROW_IS_HEADER && !fieldNames) {
									fieldNames = data;
							    	debugStats('using row as header');
								} else {
									numImport++;
									if (numImport <= limitSkip) {
								    	debugStats('skipping row');
								    	return;
									}
									if (limitMax && numImport - limitSkip > limitMax) {
								    	debugStats('reached limit, ending');
										ended = true;
										self.end();
										return;
									}


									if (FIRST_ROW_IS_HEADER) {
										var doc = {};
										for (var i = 0; i < fieldNames.length; i++) {
											doc[fieldNames[i]] = data[i];
										}
									} else {
										doc['data'] = data;
									}
									var model = new Model(doc);
									
									/*numSaving++;
									model.save(function(err) {
								    	debugStats('on save original');
										doc = null; 
										model = null;
										numSaving--;
										if (numSaving == 0) {
									    	self.readStream.resume();
									    	debugStats('resume');
										}
									});*/
									
									var point = convertOriginalToPoint(model, converter);
									model = null;

									if (point) {
										point.pointCollection = collection;
										point.created = new Date();
										point.modified = new Date();
										if (maxVal == undefined || maxVal < point.get('val')) {
											maxVal = point.get('val');
										}

										if (minVal == undefined || minVal > point.get('val')) {
											minVal = point.get('val');
										}
										numSaving++;
										importCount++;

										var saveHandler = makeSaveHandler(point, self);
										point.save(saveHandler);
									} else {
								    	postSave(self);
									}
			
									if (numRead == 1 || numRead % 1000 == 0) {
								    	if (global.gc) {
									    	// https://github.com/joyent/node/issues/2175
									    	process.nextTick(function () {
									    		var mem1 = process.memoryUsage();
										    	debugStats('force garbage collection');
												global.gc(true);
												var mem2 = process.memoryUsage();
										    	debugStats('memory usage: before ' + 
										    		Math.round(mem1.rss / 1048576) + 'MiB, after: ' +
										    		Math.round(mem2.rss / 1048576) + 'MiB, freed: ' +
										    		Math.round((1 - mem2.rss / mem1.rss) * 100) + '%');
											});
								    	}

								    	debugStats('update progress');
								    	collection.progress = numDone;
								    	collection.save();
									}
								}
					
						    })
						    .on('end',function(count) {
						    	ended = true;
						    	debugStats('on end');
								if (numSaving == 0 && !finalized) {
									finalize();
								}
						    })
						    .on('error',function(error){
						        console.log(error.message);
						    });
							break;
				
					case 'json':
				
						console.log('/public/data/reactors.json');
						var parsedJSON = require('/public/data/reactors.json');
						//console.log(parsedjson);
				
						break;
				}
			}
		});
	};

	if (!appendCollectionId) {
		console.log('Creating new collection');

		var defaults = new LayerOptions(COLLECTION_DEFAULTS);
		for (var key in COLLECTION_DEFAULTS) {
			if (req.body[key]) {
				defaults[key] = req.body[key];
			}
		}
		defaults.save(function(err) {
			if (err) {
				res.send('oops error', 500);
				return;
			}
			runImport(new PointCollection({
			    name: req.params.name,
				defaults: defaults._id,
				title: req.body.title || file,
				description: req.body.description,
				unit: "",
				progress: 0,
			}));
		});

	} else {
		console.log('Appending to collection '+appendCollectionId);
		PointCollection.findOne({_id: appendCollectionId}, function(err, collection) {
			if (err) {
				console.log('Could not find collection');
				return;
			}
			runImport(collection);
		});
	}

});

/////////////////////
// MAP REDUCE ROUTES 
////////////////////

app.get('/api/safecast/:zoom', function(req, res){
	
	Safecast = mongoose.model('Safecast', new mongoose.Schema({ any: {} }), 'safecast_grid_' + req.params.zoom);
	Safecast.find(function(err, datasets) {
	   res.send(datasets);
	});
	
});

/////////////////
// COMMENTS 
////////////////

app.get('/api/comments/map/:mapid', function(req, res){
  Comment.find({mapid:req.params.mapid},function(err, datasets) {
     res.send(datasets);
  });
});

app.post('/api/comment/:commentid/:mapid/:lat/:lon/:name/:text/:date', function(req, res){
  var comment;
  comment = new Comment({
	commentid: 	req.params.commentid,
	mapid: 		req.params.mapid,
	lat: 		req.params.lat,
	lon: 		req.params.lon,
    name: 		req.params.name,
	text: 		req.params.text, 
	date: 		req.params.date,
  });

  comment.save(function(err) {
    if (!err) {
	 	res.send(comment);
    } else
	{
		res.send('oops', 500);
	}
  });
});

///////////////
// LIVE CHAT 
///////////////

app.get('/api/chat/:mapid', function(req, res){

  Chat.find({mapid:req.params.mapid},function(err, datasets) {
     res.send(datasets);
  });
});

app.post('/api/chat/:mapid/:name/:text/:date', function(req, res){
  var chat;
  chat = new Chat({
	mapid: 		req.params.mapid,
    name: 		req.params.name,
	text: 		req.params.text, 
	date: 		req.params.date,
  });

  chat.save(function(err) {
    if (!err) {
	 	res.send(chat);
    } else
	{
		res.send('oops', 500);
	}
  });
});

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


//////////////////////
// POINT COLLECTIONS
//////////////////////

app.get('/api/histogram/:pointcollectionid', function(req, res) {
	PointCollection.findOne({_id: req.params.pointcollectionid, active: true}, function(err, pointCollection) {
		if (!err && pointCollection) {
			collectionName = 'r_points_hist-' + HISTOGRAM_STEPS;
			var Model = mongoose.model(collectionName, new mongoose.Schema(), collectionName);
			var query = {'value.pointCollection': mongoose.Types.ObjectId(req.params.pointcollectionid)};
			console.log(query);
			Model.find(query, function(err, datasets) {
				if (err) {
					res.send('ooops', 404);
					return;
				}
				values = [];
				for (var i = 0; i < datasets.length; i++) {
					var reduced = datasets[i].get('value');
					values[reduced.val.step] = reduced.count;
				}
				var histogram = []; 
				for (var step = 0; step < HISTOGRAM_STEPS; step++) {
					histogram.push({
						x: step,
						y: values[step] ? values[step] : 0
					})
				}
				res.send(histogram);
			});
		} else {
			res.send('ooops', 404);
		}
	});
});

app.get('/api/mappoints/:pointcollectionid', function(req, res) {

	PointCollection.findOne({_id: req.params.pointcollectionid, active: true}, function(err, pointCollection) {
		if (!err && pointCollection) {
			var urlObj = url.parse(req.url, true);

			zoom = urlObj.query.z || 0;
			grid_size = GRID_SIZES[zoom];
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
				console.log(b[0] > b[2], '----');

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
						if (err || !datasets) {
							console.log(err);
							res.send('ooops', 500);
							return;
						}
						console.log(datasets);
						for (var i = 0; i < datasets.length; i++) {
							if (PointModel != Point) {
								var reduced = datasets[i].get('value');
								var resVal = reduced.val.avg;
								var resAltVal;
								if (reduced.altVal != null) {
									resAltVal = [];
									for (var v = 0; v < reduced.altVal.length; v++) {
										resAltVal[v] = reduced.altVal[v].avg;
									}
								}
								var p = {
									val: resVal,
									altVal: resAltVal,
									count: reduced.count,
									datetime: reduced.datetime,
									loc: [reduced.loc[0], reduced.loc[1]],
								};

								var p = reduced;

							} else {
								var p = {
									val: datasets[i].get('val'),
									altVal: datasets[i].get('altVal'),
									count: 1,
									datetime: datasets[i].get('datetime'),
									loc: datasets[i].get('loc'),									
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

			modelCount(Point, {'pointCollection': req.params.pointcollectionid}, function(err, c) {
				fullCount = c;
				// TODO: should count points in all boxes and not reduce if < 1000
				reduce = reduce && zoom < 14;
				if (reduce) {
					collectionName = 'r_points_loc-'+grid_size+(time_grid ? '_' + time_grid : '');
					PointModel = mongoose.model(collectionName, new mongoose.Schema(), collectionName);
					pointQuery = {'value.pointCollection': mongoose.Types.ObjectId(req.params.pointcollectionid)};
					dequeueBoxQuery();
				} else {
					/*
					collectionName = 'points';
					PointModel = Point;
					pointQuery = {'pointCollection': req.params.pointcollectionid};
					dequeueBoxQuery();
					*/
					
					collectionName = 'r_points_loc-0';
					PointModel = mongoose.model(collectionName, new mongoose.Schema(), collectionName);
					pointQuery = {'value.pointCollection': mongoose.Types.ObjectId(req.params.pointcollectionid)};
					dequeueBoxQuery();
				}
			});


		} else {
			res.send('ooops', 404);
		}
	});

});

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

//Associative Collection (keeps track of collection id & name)
app.get('/api/pointcollection/:id', function(req, res){
	PointCollection.findOne({_id: req.params.id, $or: [{active: true}, {busy: true}]})
		.populate('defaults')
		.run(function(err, pointCollection) {
			if (!err && pointCollection) {
				res.send(pointCollection);
			} else {
				res.send('ooops', 404);
			}
		});
});

//Return all Point Collections
app.get('/api/pointcollections', function(req, res){
  PointCollection.find({active: true}, function(err, datasets) {
     res.send(datasets);
  });
});

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
app.delete('/api/pointcollection/:id', function(req, res){
	
	PointCollection.remove({collectionid:req.params.id}, function(err) {
	      if (!err) {
	        console.log("removed pointcollection");
	        res.send('')
	      }
	      else {
			res.send('oops', 500);
		  }
	  });
});

//////////
// MAPS 
/////////

//Returns all unique maps
app.get('/api/uniquemaps' , function(req, res){
	
	Map.find(function(err, data) {
	    if (!err) {		
	       res.send(data);
	    } else
		{
			res.send("oops",500);
		}
	});
});

//Returns the collections associated with a unique map by mapId
/*
app.get('/api/maps/:mapid' , function(req, res){
	
	PointCollection.find({mapid : req.params.mapid}, function(err, data){
		if (!err) {
			res.send(data);
		} else
		{
			res.send("oops",500);
		}
	});
});
*/

function deprecatedMap(map) {
	var m = {};
	var obj = map.toObject();
	for (var k in obj) {
		m[k] = obj[k];
		if (k == 'layers') {
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


//Returns a specific unique map by mapId
app.get('/api/map/:publicslug', function(req, res){
	
	Map.findOne({publicslug: req.params.publicslug})
		.populate('layers.pointCollection')
		.populate('layers.options')
		.run(function(err, map) {
			if (err) {
				res.send("oops", 500);
				return;
			} else if (!map) {
				res.send("oops", 404);
				return;
			}

	       	res.send(deprecatedMap(map));
		});
});

//Returns a specific unique map by mapId in admin state
app.get('/api/map/admin/:adminslug', function(req, res) {
	
	Map.findOne({adminslug: req.params.adminslug})
		.populate('layers.pointCollection')
		.populate('layers.options')
		.run(function(err, map) {
			if (err) {
				res.send("oops", 500);
				return;
			} else if (!map) {
				res.send("oops", 404);
				return;
			}

	       	res.send(deprecatedMap(map));
		});
});

//Create a new map
app.post('/api/map/:mapid/:mapadminid/:name', function(req, res){
	
	var currDate = Math.round((new Date).getTime() / 1000);
	var collections = {};
	
	var map = new Map({
		title: req.params.name,
		description: '',
		adminslug: req.params.mapadminid,
		publicslug: req.params.mapid,
		created: currDate,
		modified: currDate,
		created_by: '',
		modified_by: '',
		collections: collections,
	});	
	
	map.save(function(err) {
	    if (!err) {
		 	res.send(map);
	    } else {
			res.send('oops', 500);
		}
	  });
});

app.post('/api/bindmapcollection/:publicslug/:pointcollectionid', function(req, res){
	
	var publicslug = req.params.publicslug;
    var pointcollectionid = req.params.pointcollectionid;

	console.log(req.body)

    PointCollection.findOne({_id: pointcollectionid, active: true})
    	.populate('defaults')
    	.run(function(err, collection) {
		    if (err || !collection) {
				res.send('oops', 404);
				return;
		    }

		    var defaults = collection.defaults.toObject();
		    delete defaults['_id'];
		    var options = new LayerOptions(defaults);

		    options.save(function(err) {
			    if (err) {
					res.send('oops error', 500);
					return;
				}
			    var layer = new MapLayer({
			    	pointCollection: collection,
			    	options: options._id
			    });    

				Map.findOne({ publicslug: publicslug }, function(err, map) {
					if (err || !map) {
						res.send('oops error', 500);
						return;
					}
			      	map.layers.push(layer);
			      	map.save(function(err, map) {
						if (err) {
							res.send('oops error', 500);
							return;
						}
				        console.log("collection bound to map");
						Map.findOne({_id: map._id})
							.populate('layers.pointCollection')
							.populate('layers.options')
							.run(function(err, map) {
							    if (!err) {
							       	res.send(deprecatedMap(map));
							    } else {
									res.send("oops",500);
								}
							});
				  	});
			  	});
		    });
	    });
});

app.post('/api/updatemapcollection/:publicslug/:pointcollectionid', function(req, res){
	
	var publicslug = req.params.publicslug;
    var collectionid = req.params.pointcollectionid;

	var options = {
		visible : Boolean(req.body.visible),
		featureType : String(req.body.featureType),
		colors: req.body.colors,
		colorType: String(req.body.colorType),
		opacity: Number(req.body.opacity) || null
	};

	for (var i = 0; i < options.colors.length; i++) {
		var c = options.colors[i];
		if (c.position || options.colorType != 'S') {
			c.position = Number(c.position) || 0.0;
		}
	}
	// sort by position
	options.colors.sort(function(a, b) { return (a.position - b.position) });

	Map.findOne({publicslug: publicslug})
		.populate('layers.pointCollection')
		.populate('layers.options')
		.run(function(err, map) {
			if (!err && map) {
				console.log(map._id);
				for (var i = 0; i < map.layers.length; i++) {
					if (map.layers[i].pointCollection._id.toString() == collectionid) {
						for (var k in options) {
							map.layers[i].options[k] = options[k];
						}
						map.layers[i].options.save(function(err) {
							if (err) {
								res.send('oops error', 500);
								return;
							}
							console.log('layer options updated');
							res.send('');
						});
						break;
					}
				}
			} else {
				res.send('ooops', 404);
			}
	  	});
});

app.post('/api/unbindmapcollection/:publicslug/:collectionid', function(req, res){
	var publicslug =  String(req.params.publicslug);
    var collectionid = String(req.params.collectionid);
	
	Map.findOne({publicslug: publicslug})
		.populate('layers.pointCollection')
		.populate('layers.options')
		.run(function(err, map) {
			if (!err && map) {
				for (var i = 0; i < map.layers.length; i++) {
					if (map.layers[i].pointCollection._id.toString() == collectionid) {
						map.layers[i].options.remove();
						map.layers[i].remove();
						break;
					}
				}
				map.save(function(err) {
					if (err) {
						res.send('oops error', 500);
						return;
					}
					console.log('map updated');
					res.send('');
				});
			} else {
				res.send('ooops', 404);
			}
	  	});
	
});

app.delete('/api/map/:mapid', function(req, res){
   Map.remove({mapid:req.params.mapid}, function(err) {
      if (!err) {
        console.log("map removed");
        res.send('')
      }
      else {
		res.send('oops error', 500);
	  }
  });
});

////////////
// TWEETS 
///////////

app.get('/tweetstream', function(req, res){
	
	// LON/LAT format
	//Japan Bounding Coordinates: 128.496094,30.524413,146.953125,45.213004
	//World Bounding Coordinates: -172.968750,-84.673513,172.968750,84.405941
	//San Fran Bounding Coordinates: -122.75,36.8,-121.75,37.8
	
	twit.stream('statuses/filter', {'locations':'128.496094,30.524413,146.953125,45.213004','track':['radiation','放射線','fukushima','福島県','safecast','geiger']}, function(stream) {
	      console.log('Twitter stream open...');
			stream.on('data', function (data) {

				console.log(data.text);
				console.log(data.geo);

				if(data.geo != null || data.location != undefined)
				{
					tweet = data.text
					if(tweet.search(/radiation|放射線|fukushima|福島県|safecast|geiger/i) != -1)
					{
						console.log(data.text);
						console.log(data.geo);

						latitude = data.geo.coordinates[0];
						longitude = data.geo.coordinates[1];

						var tweet;
						tweet = new Tweet({text:data.text, lat:latitude, lng:longitude});

						tweet.save(function(err) {
						    if (!err) {
								//
						    } else
							{
								//
							}
						});

					}				
				}
	      });
	});
});

app.get('/tweets', function(req, res){
	twit.search('',{geocode:'40.63971,-73.778925,100mi',rpp:'100'}, function(data) {		
		for (var key in data.results) {
			console.log(data.results[key].geo);
		}
	});	
});

app.get('/api/tweets', function(req, res){
  Tweet.find(function(err, datasets) {
     res.send(datasets);
  });
});

var port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0");
console.log('Server running at http://0.0.0.0:' + port + "/");
