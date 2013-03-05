var application_root = __dirname,
	config = require("./config.js"),
	path = require("path"),
	express = require("express"),
  	mongoose = require('mongoose'),
  	models = require('./models.js'),
  	utils = require('./utils.js'),
  	permissions = require('./permissions.js'),
  	ejs = require('ejs'),
    console = require('./ext-console');

var templates;
var port = process.env.PORT || 3000;
var app = express();

app.configure(function() {
	var staticDir = __dirname 
		+ (process.env.NODE_ENV == 'production' ? '/public-build' : '/public');
	console.info('Serving static files from '+staticDir);
	app.use(express.static(staticDir));
	app.use(express.logger('dev'));
  	app.use(express.compress());
	app.use(express.methodOverride());
 	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({ secret: "keyboard cat" }));	
  	app.use(app.router);
  	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	
	/*
	// TODO: Proper error handling with friendly error pages
	function errorHandler(err, req, res, next) {
		console.error(err.stack);
		res.send(500, 'Something broke!');
	}
	app.use(errorHandler);
	*/
  	
  	app.set('views', path.join(application_root, "views"));
});

var API = require('./api');
new API(app);

function serveHome(req, res)
{
	if (!config.LIMITED_PROD_ACCESS) {
		// TODO: make sure the 'static' home page is served.
		// currently, requesting /admin/existing-map without admin privileges 
		// would still serve that map (in non-admin mode).
		res.end(ejs.render(templates['public/base.html'], {
			nodeEnv: process.env.NODE_ENV,
			mapSlugByHost: false
		}));
	} else {
		// home page on production server is disabled for now
		res.send('', 403);
		res.end();
	}
}


//app.get('/', serveHome);

// Admin Route

app.get(/^\/admin\/([A-Za-z0-9\+\/]{24})(|\/(|globe|map|setup))/, function(req, res)
{
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

function staticRoute(req, res, slug, admin)
{
	var serveMap = function(err, map, routingByHost) {
		if (utils.handleDbOp(req, res, err, map, 'map', (admin ? permissions.canAdminMap : null))) return;
		console.log('serving map: '+map.publicslug+', admin: '+admin);
		if (admin) {
			req.session.user = map.createdBy;
			console.log('Implicitly authenticated user:', req.session.user);
		}
		res.end(ejs.render(templates['public/base.html'], {
			nodeEnv: process.env.NODE_ENV,
			mapSlugByHost: (routingByHost ? map.publicslug : false)
		}));
	}

	console.log('Requesting slug:', slug, '-- admin:', admin, '-- host:', req.headers.host);

	if (slug) {
		// For any hosts other than the default hosts, passing a slug is not allowed
		// so that requests like <my-custom-host>/<somebody-else's-slug> are blocked.
		if (config.DEFAULT_HOSTS.indexOf(req.headers.host) == -1) {
			res.send('', 403);
			res.end();
			return;
		}
 		// Try to find map by slug
		models.Map.findOne({publicslug: slug, active: true}, function(err, map) {
			serveMap(err, map);
		});
	} else {
		// Serve the home page
		if (config.DEFAULT_HOSTS.indexOf(req.headers.host) != -1) {
			serveHome(req, res);
			return;
		}
		// Try to find map by host
		models.Map.findOne({host: req.headers.host, active: true}, function(err, map) {
			// Serve the home page if there is no map with that host
			if (!err && !map) {
				serveHome(req, res);
				return;
			}
			// Otherwise serve the map
			serveMap(err, map, true);
		});
	}
}


// routingByHost routes without slug. 

// matches /admin[/view:options][/x,y,z]
app.get(/^\/admin(\/(globe|map|setup)(:[^\/]*)?)?(\/[0-9\-\.,]*)?$/, function(req, res) 
{
	return staticRoute(req, res, null, true)
});

// matches /[view:options][/x,y,z]
app.get(/^\/((globe|map|setup)(:[^\/]*)?)?(\/[0-9\-\.,]*)?$/, function(req, res) 
{
	return staticRoute(req, res, null, false)
});


// regular routes including slug

// matches /admin/slug/[/view:options][/x,y,z]
app.get(/^\/admin\/([a-zA-Z0-9\-\_]+)(\/(globe|map|setup)(:[^\/]*)?)?(\/[0-9\-\.,]*)?$/, function(req, res) 
{
	return staticRoute(req, res, req.params[0], true)
});

// matches /slug/[/view:options][/x,y,z]
app.get(/^\/([a-zA-Z0-9\-\_]+)(\/(globe|map|setup)(:[^\/]*)?)?(\/[0-9\-\.,]*)?$/, function(req, res) 
{
	return staticRoute(req, res, req.params[0], false)
});


// Connect DB, load templates and start listening

utils.connectDB(function() {
	utils.loadFiles(['public/base.html'], __dirname, function(err, contents) {
	    if (err) {
	    	throw err;
	    } else {
	        templates = contents;
			app.listen(port, "0.0.0.0");
			console.success('Web server running at http://0.0.0.0:' + port + "/");
	    }
	});
}, false);

process.on('uncaughtException', function(err) {
	// TODO: notify admin
	console.error(err.stack);
	if (config.DEV) {
		throw err;
	}
});
