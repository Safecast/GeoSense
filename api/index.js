var MapAPI = require('./map.js'),
	PointAPI = require('./point.js'),
	ImportAPI = require('./import.js'),
	MapReduceAPI = require('./mapreduce');

var API = function(app)
{
	return {
		map: new MapAPI(app),
		point: new PointAPI(app),
		import: new ImportAPI(app),
		mapReduce: new MapReduceAPI(app)
	};
};

module.exports = API;
