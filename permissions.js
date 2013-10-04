var config = require("./config"),
	console = require('./ext-console'),
	models = require('./models');

var canAdminMap = function(req, map) 
{
	return canAdminModel(req, map)
		|| isSessionAdminAllowed(req, map);
};

var allowSessionAdmin = function(req, doc)
{
	if (!req.session.canAdminModels) {
		req.session.canAdminModels = {};
	}
	req.session.canAdminModels[doc._id.toString()] = doc.constructor.modelName;
	console.warn('allwoSessionAdmin: ', doc.constructor.modelName, doc._id);
};

var isSessionAdminAllowed = function(req, doc)
{
	return req.session.canAdminModels != undefined &&
		req.session.canAdminModels[doc._id.toString()] == doc.constructor.modelName;
};

var setUserForSessionAdminModels = function(req, callback)
{
	var modelNames = req.session.canAdminModels || {}
		queue = Object.keys(modelNames);

	if (!req.user) {
		callback();
		return;
	}
	console.info('Associating models with user', req.user._id, queue);

	var dequeueUpdate = function(err) {
		if (!queue.length) {
			callback(err);
			return;
		}
		var id = queue.shift(),
			modelName = modelNames[id],
			model = models[modelName];
		model.findById(id, function(err, doc) {
			if (err) {
				console.error(err);
			}
			if (!err && doc && !doc.createdBy) {
				doc.createdBy = req.user;
				doc.save(function(err, doc) {
					if (err) {
						console.error(err);
					} else {
						delete req.session.canAdminModels[id];
						console.success('Associated '+modelName+' '+doc._id+' with User '+doc.createdBy);
					}
					dequeueUpdate();
				})
				return;
			}
			dequeueUpdate();
		});
	};

	dequeueUpdate();
};

var sameUser = function(u1, u2)
{
	if (!u1 || !u2) return false;
	var _id1 = u1._id != undefined ? u1._id : u1; 
	var _id2 = u2._id != undefined ? u2._id : u2; 
	return _id1.toString() == _id2.toString();
};

var canAdminModel = function(req, doc) 
{
	var res = sameUser(req.user || {}, doc.createdBy);
	if (config.VERBOSE) {
		console[res ? 'success' : 'warn']('canAdminModel '+(doc.collection ? doc.collection.name : ''), (req.user ? req.user.email : '(no user)'), (res ? 'YES' : 'NO'), '_id:', doc._id, 
				'createdBy:', (doc.createdBy ? (doc.createdBy._id ? doc.createdBy._id : doc.createdBy) : '(no user)'));
	}
	return res;
};

var canViewMap = function(req, map) 
{
	var userIsOwner = sameUser(req.user, map.createdBy);
	return (map.active || userIsOwner) &&
		(map.sharing == config.SharingType.WORLD 
		|| userIsOwner
		|| (req.params && req.params.secretSlug != undefined 
			&& req.params.secretSlug == map.secretSlug)
		|| canAdminMap(req, map));
};

var canViewFeatureCollection = function(req, map, featureCollection) 
{
	return canViewMap(req, map)
		&& (featureCollection.sharing == config.SharingType.WORLD
		|| sameUser(map.createdBy, featureCollection.createdBy)
		|| canAdminModel(req, featureCollection));
};

var canCreateMap = function(req) 
{
	return !config.LIMITED_PROD_ACCESS;
}

var canImportData = function(req) 
{
	return !config.LIMITED_PROD_ACCESS;
}

var requireLogin = function(req, res, next) 
{
    if (req.isAuthenticated()) {
        next();
    } else {
    	if (req.xhr) {
	        res.redirect('login', 403);
    	} else {
    		var nextUrl = req.method != 'POST' ? req.url : req.headers.referer;
    		// sending a 403 will result in browser displaying the "Forbidden. Redirecting to /login" message
	        res.redirect('/login' + (nextUrl ? '?next=' + nextUrl : ''));
    	}
    }
}

module.exports = {
	canAdminMap: canAdminMap,
	canAdminModel: canAdminModel,
	canViewMap: canViewMap,
	canViewFeatureCollection: canViewFeatureCollection,
	canCreateMap: canCreateMap,
	canImportData: canImportData,
	requireLogin: requireLogin,
	sameUser: sameUser,
	allowSessionAdmin: allowSessionAdmin,
	setUserForSessionAdminModels: setUserForSessionAdminModels
};