var MapAPI = require('./map'),
	FeatureAPI = require('./feature'),
	ImportAPI = require('./import'),
	MapReduceAPI = require('./mapreduce');

var API = function(app)
{
	return {
		map: new MapAPI(app),
		feature: new FeatureAPI(app),
		import: new ImportAPI(app),
		mapReduce: new MapReduceAPI(app)
	};
};

module.exports = API;
