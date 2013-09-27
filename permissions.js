var config = require("./config"),
	console = require('./ext-console');

var canAdminMap = function(req, map) 
{
	return canAdminModel(req, map);
	/*
	if (!req.session.admin) {
		req.session.admin = {};
	}
	if (status != null) {
		req.session.admin[map._id] = status == true; 
		console.log('set map admin: '+map._id+' = '+status);
	} else {
		if (!config.DEBUG || !config.DEBUG_CIRCUMVENT_PERMISSIONS) {
			status = req.session.admin[map._id] == true;
			console.log('is map admin: '+map._id+' == '+status);
		} else {
			status = true;
			console.log('DEBUG on, is map admin: '+map._id+' == '+status);
		}
	}
	return status;*/
};

var allowSessionAdmin = function(req, doc)
{

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
    		// sending a 403 will result in browser displaying the "Forbidden. Redirecting to /login" message
	        res.redirect('login?next=' + req.url);
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
	allowSessionAdmin: allowSessionAdmin
};