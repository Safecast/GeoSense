var application_root = __dirname,
  	apiUtil = require('./api/util'),
	config = require("./config.js"),
	path = require("path"),
	express = require("express"),
  	mongoose = require('mongoose'),
  	models = require('./models.js'),
  	utils = require('./utils.js'),
  	flash = require('connect-flash'),
  	permissions = require('./permissions.js'),
  	ejs = require('ejs'),
    console = require('./ext-console'),
    _ = require('cloneextend'),
	passport = require('passport'),
  	LocalStrategy = require('passport-local').Strategy;

var templates;
var app = express();

var	clientErrorHandler = function(err, req, res, next) 
{
	if (req.xhr) {
		if (!config.DEBUG) {
			res.send(500, { error: 'An error occurred on the server' });
		} else {
			res.send(500, err.toString());
		}
	} else if (!config.DEBUG) {
		serveError(req, res, 500)
	} else {
		next(err);
	}
}

app.configure(function() {
	var staticDir = __dirname 
		+ (process.env.NODE_ENV == 'production' ? '/public-build' : '/public');
	console.info('Serving static files from '+staticDir);
	app.use(express.static(staticDir));
	app.use(express.logger('dev'));
  	if (!config.DEV) {
	  	app.use(express.compress());
  	}
	app.use(express.methodOverride());
 	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({ secret: "keyboard cat" }));	
	app.use(flash());

	passport.use(new LocalStrategy(
		{
			usernameField: 'email',
	    	passwordField: 'password'
	    },
		function(email, password, done) {
			console.log('authenticating:', email);
	    	models.User.findOne({ email: email }, function(err, user) {
				if (err) { return done(err); }
				if (!user || !user.validPassword(password)) {
					return done(null, false, { message: 'Incorrect email address or password.' });
				}
				return done(null, user);
		    });
	  	}	
	));
	passport.serializeUser(function(user, done) {
        done(null, user._id.toString());
    });
	passport.deserializeUser(function(id, done) {
		models.User.findById(id, function(err, user) {
	    	done(err, user);
	  	});
	});
	app.use(passport.initialize());
	app.use(passport.session());

  	app.use(app.router);
	app.use(clientErrorHandler);
  	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

 	
  	app.set('views', path.join(application_root, "views"));
});

var API = require('./api'),
	apiUtil = require('./api/util');
	api = new API(app);

var getRenderVars = function(req, vars) {
	if (!req.flashMessages) {
		req.flashMessages = req.flash();
	}
	var vars = _.extend({
		bodyClass: undefined,
		nodeEnv: process.env.NODE_ENV,
		config: config,
		user: (req.user ? req.user.toJSONSelf() : undefined),
		messages: req.flashMessages
	}, vars);

	return vars;
}

var API = require('./api');
new API(app);

var renderPage = function(req, res, page, vars)
{
	if (!vars) {
		var vars = {};
	}
	if (!vars.bodyClass) {
		vars.bodyClass = 'page';
	}
	return ejs.render(templates['templates/base.ejs'], getRenderVars(req, _.extend(vars, {
		content: renderFragment(req, res, page, vars)
	})));
};

var renderFragment = function(req, res, page, vars)
{
	return ejs.render(templates['templates/' + page + '.ejs'], getRenderVars(req, vars));
};

var serveMap = function(req, res, map, admin, routingByHost) {
	console.success('serving map: '+map.slug+', admin: '+admin);
	if (admin) {
		req.user = map.createdBy.toJSON();
		console.warn('Implicitly authenticated user:', req.session.user);
	}
	res.end(ejs.render(templates['templates/map.ejs'], getRenderVars(req, {
		mapSlugByHost: (routingByHost ? map.slug : false),
		map: JSON.stringify(apiUtil.prepareMapResult(req, map))
	})));
};

var serveHome = function(req, res)
{
	res.end(renderPage(req, res, 'home', {bodyClass: 'home page'}));
}

var serveError = function(req, res, status)
{
	res.send(renderPage(req, res, status, {bodyClass: 'error page'}), status);
};

app.get('/login', function(req, res)
{
	res.end(renderPage(req, res, 'login', {
		next: req.query.next
	}));
});

app.post('/login', function(req, res, next) {
	var redir = req.body.next && req.body.next ? 
		req.body.next : undefined;
	passport.authenticate('local', function(err, user, info) {
	    if (err) { 
	    	return next(err); 
	    }
	    if (!user) { 
	    	return res.redirect('/login' + (redir ? '?next=' + redir : '')); 
	    }
	    req.logIn(user, function(err) {
	    	if (err) { 
				return next(err); 
			}
			return res.redirect((redir ? redir : 'dashboard'));
	    });
	})(req, res, next);
});

app.get('/signup', function(req, res)
{
	res.end(renderPage(req, res, 'signup'));
});

app.post('/signup', function(req, res, next)
{
	var data = {email: req.body.email, password: req.body.password, confirmPassword: req.body.confirmPassword};
	if (data.password != data.confirmPassword) {
		req.flash('error', 'Password does not match the confirm password.');
		res.end(renderPage(req, res, 'signup', data));
	} else {
		new models.User(data)
			.save(function(err, user) {
				if (err) {
					var messages = utils.friendlyErrorMessages(err);
					if (messages) {
						for (var i = 0; i < messages.length; i++) {
							req.flash('error', messages[i]);							
						}
					} else if (err.code == 11000) {
						console.error(err);
						req.flash('error', 'A user with this email address already exists.');
					} else {
						req.flash('error', 'Error creating user account.');
					}
					res.end(renderPage(req, res, 'signup', data));
					return;
				}
				
				req.logIn(user, function(err) {
      				if (err) { return next(err); }
      				return res.redirect('dashboard');
    			});

			});
	}
});

app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('login');
});

app.get('/', function(req, res) 
{
	if (!config.LIMITED_PROD_ACCESS) {
		serveHome(req, res);
	} else {
		// home page on production server is disabled for now
		serveError(req, res, 403);
	}
});

app.get('/dashboard', [permissions.requireLogin], function(req, res) {
   	res.end(renderPage(req, res, 'dashboard', {bodyClass: 'dashboard page'}));
});

app.get('/about', function(req, res) {
   	res.end(renderPage(req, res, 'html', {bodyClass: 'about page marketing', 
   		title: 'Project Background', html: ejs.render(templates['public/templates/help/about.html'])}));
});

app.get('/contact', function(req, res) {
   	res.end(renderPage(req, res, 'html', {bodyClass: 'about page marketing', 
   		title: 'Contact us', html: renderFragment(req, res, 'contact')}));
});

app.get('/legal:privacy-policy', function(req, res) {
   	res.end(renderPage(req, res, 'html', {bodyClass: 'about page', 
   		title: 'Privacy Policy', html: renderFragment(req, res, 'privacy')}));
});

app.get('/legal:terms', function(req, res) {
   	res.end(renderPage(req, res, 'html', {bodyClass: 'about page', 
   		title: 'Terms of Use', html: renderFragment(req, res, 'terms')}));
});

app.get(/^\/admin\/([a-zA-Z0-9\-\_]+)/, [/*permissions.requireLogin*/], function(req, res) 
{
	req.params.slug = req.params[0];
	apiUtil.findMapForRequest(req)
		.exec(function(err, map) {
			if (err) {
				throw err;
			} else if (!map) {
				return serveError(req, res, 404);
			} else if (!permissions.canAdminMap(req, map)) {
				return res.redirect('login?next=' + req.url);
			}

			req.session.user = map.createdBy;
			console.warn('Implicitly authenticated user:', req.session.user);

			serveMap(req, res, map);
		});
});

app.get(/^\/s\/([a-zA-Z0-9\-\_]+)/, function(req, res) 
{
	req.params.secretSlug = req.params[0];
	apiUtil.findMapForRequest(req)
		.exec(function(err, map) {
			if (err) {
				throw err;
			} else if (!map || !permissions.canViewMap(req, map)) {
				return serveError(req, res, 404);
			}
			serveMap(req, res, map);
		});
});

app.get(/^\/([a-zA-Z0-9\-\_]+)/, function(req, res) 
{
	req.params.slug = req.params[0];
	apiUtil.findMapForRequest(req)
		.exec(function(err, map) {
			if (err) {
				throw err;
			} else if (!map || !permissions.canViewMap(req, map)) {
				return serveError(req, res, 404);
			}
			serveMap(req, res, map);
		});
});

/*
if (slug) {
		// For any hosts other than the default hosts, passing a slug is not allowed
		// so that requests like <my-custom-host>/<somebody-else's-slug> are blocked.
		if (config.DEFAULT_HOSTS.indexOf(req.headers.host) == -1) {
			res.send('', 403);
			res.end();
			return;
		}
 		// Try to find map by slug
		models.Map.findOne({slug: slug, active: true}, function(err, map) {
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

*/

// Connect DB, load templates and start listening

if (!config.BASE_URL) {
	console.error('config.BASE_URL is not defined');
} else {
	console.info('Base URL:', config.BASE_URL);
}
console.info('Environment:', process.env.NODE_ENV);

utils.connectDB(function() {
	utils.loadFiles(
		[
			'templates/base.ejs', 
			'templates/home.ejs', 
			'templates/dashboard.ejs', 
			'templates/map.ejs', 
			'templates/signup.ejs', 
			'templates/login.ejs', 
			'templates/500.ejs',
			'templates/404.ejs',
			'templates/403.ejs',
			'templates/html.ejs',
			'templates/privacy.ejs',
			'templates/terms.ejs',
			'templates/contact.ejs',
			'public/templates/help/about.html'		
		], __dirname, function(err, contents) {
		    if (err) {
		    	throw err;
		    } else {
		        templates = contents;
				app.listen(config.SERVER_PORT, config.SERVER_HOST);
				console.success('Web server running at http://' + config.SERVER_HOST + ':' + config.SERVER_PORT + "/");
		    }
		});
}, false);

