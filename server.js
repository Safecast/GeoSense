var application_root = __dirname,
  	express = require("express"),
  	path = require("path"),
  	mongoose = require('mongoose'),
  	twitter = require('twitter');

var app = express.createServer();

//Now.js
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

//nTwitter
var	count = 0,
	lastc = 0;

function tweet(data) {
	count++;
	if ( typeof data === 'string' )
		sys.puts(data);
	else if ( data.text && data.user && data.user.screen_name )
		sys.puts('"' + data.text + '" -- ' + data.user.screen_name);
	else if ( data.message )
		sys.puts('ERROR: ' + sys.inspect(data));
	else
		sys.puts(sys.inspect(data));
}

function memrep() {
	var rep = process.memoryUsage();
	rep.tweets = count - lastc;
	lastc = count;
	console.log(JSON.stringify(rep));
	// next report in 60 seconds
	setTimeout(memrep, 60000);
}

var twit = new twitter({
	consumer_key: '7qvSnSrhvjsk303fhOtSDg',
	consumer_secret: 'NKfINCJgnnuc7gCu5Tkx69OhkKFaWFmubChn1nK3uVw',
	access_token_key: '10425532-2AuLCxYMHjt8ECvrdVSaIclERaYezVsdVJLFx7wyt',
	access_token_secret: '6vX7aDY6WJjtYyokwkaLRS5FchC3f9I42gzTjRCpc'
})

//App
mongoose.connect('mongodb://localhost/geo');

app.configure(function(){
	app.use(express.static(path.join(application_root, "public")));
	app.use(express.logger('dev'));
 	app.use(express.bodyParser());
	app.use(express.methodOverride());
  	app.use(app.router);
  	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  	app.set('views', path.join(application_root, "views"));
});

///////////
// Twitter API
///////////
/*
app.get('/tweets', function(req, res){
	twit.stream('statuses/filter', {'locations':'-122.75,36.8,-121.75,37.8,-74,40,-73,41'}, function(stream) {
	      stream.on('data', function (data) {
	        return res.send(data);
	     });
	});
});

app.get('/api/tweets', function(req, res){
  	return twit.stream('statuses/filter', {'locations':'-122.75,36.8,-121.75,37.8,-74,40,-73,41'}, function(stream) {
	      stream.on('data', function (data) {
	        return res.send(data);
	     });
	});
});
*/

///////////
// DATA API
///////////

var Point = mongoose.model('Point', new mongoose.Schema({
	collectionid: Number,
}));

var PointCollection = mongoose.model('PointCollection', new mongoose.Schema({
	collectionid: Number,
	name: String,
}));

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

app.get('/api/collection/distinct', function(req, res){
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

app.post('/api/pointcollection/:id/:name', function(req, res){
	
	var collection;
	  collection = new PointCollection({
		collectionid: req.params.id,
	    name: req.params.name,
	  });
	  collection.save(function(err) {
	    if (!err) {
		 	res.send(point);
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

app.listen(3000);