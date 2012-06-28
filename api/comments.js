// broken and currently unused

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
		res.send('server error', 500);
	}
  });
});
