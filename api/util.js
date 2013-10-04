var models = require('../models'),
	permissions = require('../permissions'),
	config = require('../config'),
	_ = require('cloneextend');

var findMapForRequest = function(req, q)
{
	var query = req.params.secretSlug != undefined ? 
		{secretSlug: req.params.secretSlug} : {slug: req.params.slug};
	return models.Map.findOne(_.extend(query, q))
		.populate('layers.featureCollection')
		.populate('layers.layerOptions')
		.populate('createdBy')
		.populate('modifiedBy');
}

var sortByPosition = function(arr) 
{
	return arr.sort(function(a, b) { return a.position - b.position });
}

var prepareMapResult = function(req, map) 
{
	var m = {
		admin: permissions.canAdminMap(req, map)
	};
	var obj = map.toJSON();
	for (var k in obj) {
		if (m.admin || (k != 'email')) {
			m[k] = obj[k];
		}

		if (k == 'layers') {
			var layers = m[k],
				outputLayers = [];
			layers.forEach(function(layer) {
				if (layer.featureCollection && layer.featureCollection._id 
					&& permissions.canViewFeatureCollection(req, map, layer.featureCollection)) {
						outputLayers.push(prepareLayerResult(req, layer, map));
				}
			});
			m[k] = sortByPosition(outputLayers);
		}
	}
	return m;
};

var prepareFeatureCollectionResult = function(req, featureCollection, map, extraAttrs)
{
	var obj = featureCollection.toJSON ? 
		featureCollection.toJSON() : featureCollection;
	if (!map || !permissions.canAdminModel(req, featureCollection)) {
		delete obj.importParams;
		//delete obj.fields;
	}
	if (extraAttrs) {
		obj = _.extend(obj, extraAttrs);
	}
	return obj;
};

var prepareLayerResult = function(req, layer, map) 
{
	// if this is called by prepareMapResult, the layer's toJSON() 
	// was already called.
	var layer = layer.toJSON ?
		layer.toJSON() : layer;
	layer.featureCollection = prepareFeatureCollectionResult(req, layer.featureCollection, map);

	return layer;
};

module.exports = {
	findMapForRequest: findMapForRequest,
	sortByPosition: sortByPosition,
	prepareMapResult: prepareMapResult,
	prepareLayerResult: prepareLayerResult,
	prepareFeatureCollectionResult: prepareFeatureCollectionResult
};
