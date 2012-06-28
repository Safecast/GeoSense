var application_root = __dirname,
 	utils = require("./utils.js"),	
	config = require("./config.js"),
	express = require("express"),
  	path = require("path"),
  	mongoose = require('mongoose'),
  	twitter = require('ntwitter'),
	//nowjs = require("now"),
	csv = require('csv'),    
	date = require('datejs'),
	url = require('url'),
	util = require('util'),
	uuid = require('node-uuid'),
	md5 = require('MD5'),
	_ = require('cloneextend');

var app = express.createServer();

console.log('connecting to db:', config.DB_PATH);
mongoose.connect(config.DB_PATH);

app.configure(function(){
	app.use(express.static(__dirname + '/public'));
	app.use(express.logger('dev'));
 	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser());
	app.use(express.session({ secret: "keyboard cat" }));	
  	app.use(app.router);
  	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  	app.set('views', path.join(application_root, "views"));
});

require('./api/map.js')(app);
require('./api/point.js')(app);
require('./api/import.js')(app);

// Admin Route
app.get(/^\/admin\/([a-z0-9]{32})(|\/(|globe|map|setup))$/, function(req, res){
	console.log(req.params);
	Map.findOne({adminslug: req.params[0]}, function(err, map) {
		if (handleDbOp(req, res, err, map, 'map')) return;
		permissions.canAdminMap(req, map, true);
		var url = '/admin/' + map.publicslug + req.params[1];
		res.writeHead(302, {
			'Location': url
		});
		res.end();
	});
});

// Static Route
app.get(/^\/(admin\/)?[a-zA-Z0-9\-\_]+(|\/(globe|map|setup))$/, function(req, res){
	res.sendfile('public/index.html');
});

var port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0");
console.log('Server running at http://0.0.0.0:' + port + "/");
