// broken and currently unused

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
		res.send('server error', 500);
	}
  });
});
