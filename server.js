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

// model
mongoose.connect('mongodb://localhost/geo');

var Comment = mongoose.model('Comment', new mongoose.Schema({
  text: String,
}));

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(application_root, "public")));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.set('views', path.join(application_root, "views"));
});

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
