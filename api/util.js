var models = require('../models'),
	permissions = require('../permissions'),
	config = require('../config'),
	_ = require('underscore');

var isCustomHost = function(req) {
	return config.DEFAULT_HOSTS.indexOf(req.headers.host) == -1;
};

var findMapForRequest = function(req, q)
{
	var query = {};
	if (req.params.secretSlug != undefined) {
		query.secretSlug = req.params.secretSlug;
	} else if (req.params.slug != undefined) {
		query.slug = req.params.slug;
	} else if (isCustomHost(req)) {
		query.host = req.headers.host;
	} else {
		throw new Error('Insufficient params to find map');
	}
	query = _.extend(query, q);
	console.log('findMapForRequest', query);
	return models.Map.findOne(query)
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
		},
		obj = map.toJSON(),
		hiddenFields = [];

	if (permissions.isPublic(map)) {
		// secretSlug must stay undisclosed for public maps, since they might go 
		// secret some day. For public maps, the secretSlug is not required on 
		// the frontend, neither for owners nor for users.
		hiddenFields.push('secretSlug');
	}

	for (var k in obj) {
		if (m.admin || (hiddenFields.indexOf(k) == -1)) {
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
	isCustomHost: isCustomHost,
	findMapForRequest: findMapForRequest,
	sortByPosition: sortByPosition,
	prepareMapResult: prepareMapResult,
	prepareLayerResult: prepareLayerResult,
	prepareFeatureCollectionResult: prepareFeatureCollectionResult
};
