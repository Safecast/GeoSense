var MapAPI = require('./map'),
	PointAPI = require('./point'),
	ImportAPI = require('./import'),
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
