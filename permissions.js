var config = require("./config.js")

var canAdminMap = function(req, map, status) {
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
	return status;
}

var canViewMap = function(req, map) {
	return map.status == config.MapStatus.PUBLIC || canAdminMap(req, map);
}

var canCreateMap = function(req) {
	return !config.LIMITED_PROD_ACCESS;
}

var canImportData = function(req) {
	return !config.LIMITED_PROD_ACCESS;
}

module.exports = {
	canAdminMap: canAdminMap,
	canViewMap: canViewMap,
	canCreateMap: canCreateMap,
	canImportData: canImportData
};