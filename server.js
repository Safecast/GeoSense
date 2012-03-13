var application_root = __dirname,
  express = require("express"),
  path = require("path"),
  mongoose = require('mongoose');

var app = express.createServer();

//Now
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

mongoose.connect('mongodb://localhost/geo');

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(application_root, "public")));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.set('views', path.join(application_root, "views"));
});

///////////
// DATA API
///////////

var Data = mongoose.model('Data', new mongoose.Schema({
	text: String,
	location: String,
}));

app.get('/data', function(req, res){
  res.render('data', {title: "All Data"});
});

app.get('/api/data', function(req, res){
  return Data.find(function(err, datasets) {
    return res.send(datasets);
  });
});

app.get('/api/data/:id', function(req, res){
  return Data.findById(req.params.id, function(err, data) {
    if (!err) {
      return res.send(data);
    }
  });
});

app.put('/api/data/:id', function(req, res){
  return Data.findById(req.params.id, function(err, data) {
	data.datasetid 		= req.body.datasetid;
    data.name 			= req.body.name;
    data.location 		= req.body.location;
	data.lat 			= req.body.lat;
	data.lon 			= req.body.lon;
	data.val		 	= req.body.val;

    return data.save(function(err) {
      if (!err) {
        console.log("updated");
      }
      return res.send(data);
    });
  });
});

app.post('/api/data', function(req, res){
  var data;
  data = new Data({
	datasetid: 		req.body.datasetid,
    name: 		req.body.name,
	location: 	req.body.location,
	lat: 		req.body.lat,
	lon: 		req.body.lon,
	val: 		req.body.val,
  });
  data.save(function(err) {
    if (!err) {
      return console.log("created");
    }
  });
  return res.send(data);
});

app.delete('/api/data/:id', function(req, res){
  return Data.findById(req.params.id, function(err, data) {
    return data.remove(function(err) {
      if (!err) {
        console.log("removed");
        return res.send('')
      }
    });
  });
});

/////////////
//COMMENT API
/////////////

var Comment = mongoose.model('Comment', new mongoose.Schema({
  text: String,
}));
app.get('/comment', function(req, res){
  res.render('comment', {title: "All Comments"});
});

app.get('/api/comments', function(req, res){
  return Comment.find(function(err, comments) {
    return res.send(comments);
  });
});

app.get('/api/comments/:id', function(req, res){
  return Comment.findById(req.params.id, function(err, comment) {
    if (!err) {
      return res.send(comment);
    }
  });
});

app.put('/api/comments/:id', function(req, res){
  return Comment.findById(req.params.id, function(err, comment) {
    comment.text = req.body.text;
    return comment.save(function(err) {
      if (!err) {
        console.log("updated");
      }
      return res.send(comment);
    });
  });
});

app.post('/api/comments', function(req, res){
  var comment;
  comment = new Comment({
    text: req.body.text,
  });
  comment.save(function(err) {
    if (!err) {
      return console.log("created");
    }
  });
  return res.send(comment);
});

app.delete('/api/comments/:id', function(req, res){
  return Comment.findById(req.params.id, function(err, comment) {
    return comment.remove(function(err) {
      if (!err) {
        console.log("removed");
        return res.send('')
      }
    });
  });
});

app.listen(3000);
