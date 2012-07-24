var MapAPI = require('./map.js');
var PointAPI = require('./point.js');
var ImportAPI = require('./import.js');

var API = function(app)
{
	return {
		map: new MapAPI(app),
		point: new PointAPI(app),
		import: new ImportAPI(app)
	};
};

module.exports = API;
