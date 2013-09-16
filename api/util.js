var permissions = require('../permissions'),
	_ = require('cloneextend');

var sortByPosition = function(arr) 
{
	return arr.sort(function(a, b) { return a.position - b.position });
}

var prepareMapResult = function(req, map) 
{
	var m = {
		admin: permissions.canAdminMap(req, map)
	};
	var obj = map.toObject();
	for (var k in obj) {
		if (m.admin || (k != 'email' && k != 'adminslug')) {
			m[k] = obj[k];
		}
		if (k == 'layers') {
			for (var i = 0; i < m[k].length; i++) {
				m[k][i] = prepareLayerResult(req, m[k][i], map);
			}
			m[k] = sortByPosition(m[k]);
		}
	}
	return m;
};

var prepareFeatureCollectionResult = function(req, featureCollection, map, extraAttrs)
{
	var obj = featureCollection.toObject ? 
		featureCollection.toObject() : featureCollection;
	if (!map || !permissions.canAdminMap(req, map)) {
		delete obj.importParams;
		delete obj.fields;
	}
	if (extraAttrs) {
		obj = _.extend(obj, extraAttrs);
	}
	return obj;
};

var prepareLayerResult = function(req, layer, map) 
{
	// if this is called by prepareMapResult, the layer's toObject() 
	// was already called.
	var layer = layer.toObject ?
		layer.toObject() : layer;
	layer.featureCollection = prepareFeatureCollectionResult(req, layer.featureCollection, map);

	return layer;
};

module.exports = {
	sortByPosition: sortByPosition,
	prepareMapResult: prepareMapResult,
	prepareLayerResult: prepareLayerResult,
	prepareFeatureCollectionResult: prepareFeatureCollectionResult
};
