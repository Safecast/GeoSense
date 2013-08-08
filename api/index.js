var MapAPI = require('./map'),
	FeatureAPI = require('./feature'),
	ImportAPI = require('./import'),
	AggregateAPI = require('./aggregate');

var API = function(app)
{
	return {
		map: new MapAPI(app),
		feature: new FeatureAPI(app),
		import: new ImportAPI(app),
		aggregate: new AggregateAPI(app)
	};
};

module.exports = API;
