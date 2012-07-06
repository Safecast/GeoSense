var application_root = __dirname,
	config = require("./config.js"),
	path = require("path"),
	express = require("express"),
  	mongoose = require('mongoose'),
  	models = require('./models.js'),
  	utils = require('./utils.js'),
  	permissions = require('./permissions.js');

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

/*
// TODO: Implement proper error handling with friendly 404 und 500 pages

function NotFound(msg){
	this.name = 'NotFound';
	Error.call(this, msg);
	Error.captureStackTrace(this, arguments.callee);
}
NotFound.prototype.__proto__ = Error.prototype;

app.error(function(err, req, res, next){
	console.log('app error', err);
    if (err instanceof NotFound) {
        res.send('404 template');
    } else {
        next(err);
    }
});
*/

app.get(/^$/, function(req, res) {
	res.writeHead(403, {
	});
	res.end();
});

// Admin Route
app.get(/^\/admin\/([A-Za-z0-9\+\/]{24})(|\/(|globe|map|setup))/, function(req, res){
	models.Map.findOne({adminslug: req.params[0], active: true}, function(err, map) {
		if (utils.handleDbOp(req, res, err, map, 'map')) return;
		permissions.canAdminMap(req, map, true);
		var url = '/admin/' + map.publicslug + req.params[1];
		res.writeHead(302, {
			'Location': url
		});
		res.end();
	});
});

// Static Route
app.get(/^\/(admin\/)?([a-zA-Z0-9\-\_]+)(|\/(globe|map|setup))/, function(req, res) {
	var admin = req.params[0];
	var slug = req.params[1];
	if (slug) {
		// check if map exists so that a proper error page appears if it doesn't
		models.Map.findOne({publicslug: slug, active: true}, function(err, map) {
			if (utils.handleDbOp(req, res, err, map, 'map', (admin ? permissions.canAdminMap : null))) return;
			if (admin) {
				req.session.user = map.createdBy;
				console.log('Implicitly authenticated user:', req.session.user);
			}
			res.sendfile('public/index.html');
		});
		return;
	}
	res.sendfile('public/index.html');
});

var port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0");
console.log('Server running at http://0.0.0.0:' + port + "/");
