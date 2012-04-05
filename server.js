var application_root = __dirname,
  	express = require("express"),
  	path = require("path"),
  	mongoose = require('mongoose'),
  	twitter = require('ntwitter');

var app = express.createServer();

//Now.js
/*
var nowjs = require("now");
var everyone = nowjs.initialize(app);

nowjs.on("connect", function(){
  console.log("Joined: " + this.now.name);
});

nowjs.on("disconnect", function(){
  console.log("Left: " + this.now.name);
}); 

everyone.now.distributeMessage = function(message){
  everyone.now.receiveMessage(this.now.name, message);
};
*/

mongoose.connect('mongodb://localhost/geo');

app.configure(function(){
	app.use(express.static(__dirname + '/public'));
	app.use(express.logger('dev'));
 	app.use(express.bodyParser());
	app.use(express.methodOverride());
  	app.use(app.router);
  	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  	app.set('views', path.join(application_root, "views"));
});

/////////////////
// STATIC ROUTES
////////////////

app.get('/globe', function(req, res){
   res.sendfile('public/index.html');
});

app.get('/:mapId/globe', function(req, res){
   res.sendfile('public/index.html');
});

app.get('/:mapId', function(req, res){
   res.sendfile('public/index.html');
});

///////////
// DATA API
///////////

//Models 

var Map = mongoose.model('Map', new mongoose.Schema({
	mapid: String,
	name: String,
}));

var Point = mongoose.model('Point', new mongoose.Schema({
	collectionid: Number,
}));

var PointCollection = mongoose.model('PointCollection', new mongoose.Schema({
	collectionid: Number,
	mapid: String,
	name: String,
}));

var Tweet = mongoose.model('Tweet', new mongoose.Schema({
	collectionid: Number,
	mapid: String,
}));

var TweetCollection = mongoose.model('TweetCollection', new mongoose.Schema({
	collectionid: Number,
	mapid: String,
	name: String,
}));

// Routes

app.get('/points', function(req, res){
  res.render('data', {title: "All Points"});
});

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

//Returns a specific unique map by mapId
app.get('/api/map/:mapid', function(req, res){
	
	Map.find({mapid: req.params.mapid}, function(err, data) {
	    if (!err) {
	       res.send(data);
	    } else
		{point
			res.send("oops",500);
		}
	});
});

app.post('/api/map/:mapid/:name', function(req, res){
	
	var map;
	  map = new Map({
		mapid: req.params.mapid,
	    name: req.params.name,
	  });	
	
	  map.save(function(err) {
	    if (!err) {
		 	res.send(map);
	    } else
		{
			res.send('oops', 500);
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

app.get('/api/collection/:id', function(req, res){
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
	PointCollection.find({collectionid:req.params.id}, function(err, point) {
		if (!err) {
			res.send(point);
		}
		else
		{
			res.send('ooops', 500);
		}
  });
});

app.get('/api/pointcollections', function(req, res){
  PointCollection.find(function(err, datasets) {
     res.send(datasets);
  });
});

app.post('/api/pointcollection/:id/:name/:mapid', function(req, res){
	
	var collection;
	  collection = new PointCollection({
		collectionid: req.params.id,
	    name: req.params.name,
		mapid: req.params.mapid,
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

app.get('/tweetstream', function(req, res){
	
	// LON/LAT format
	//Japan Bounding Coordinates: 128.496094,30.524413,146.953125,45.213004
	//World Bounding Coordinates: -172.968750,-84.673513,172.968750,84.405941
	//San Fran Bounding Coordinates: -122.75,36.8,-121.75,37.8
	
	twit.stream('statuses/filter', {'locations':'128.496094,30.524413,146.953125,45.213004','track':['radiation','放射線','fukushima','福島県','safecast','geiger']}, function(stream) {
	      console.log('Twitter stream open...');
			stream.on('data', function (data) {

				//console.log(data.text);
				//console.log(data.geo);

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


app.listen(8124, "0.0.0.0");
console.log('Server running at http://0.0.0.0:8124/');