var mongoose = require('mongoose'),
    adHocModels = {};

    
var adHocModel = function(collectionName, Schema, options) {
    if (!adHocModels[collectionName]) {
        var options = options || {};
        if (options.strict == undefined) {
            options.strict =  false;
        }
        var Schema = Schema || new mongoose.Schema({}, options);
        adHocModels[collectionName] = mongoose.model(
            new mongoose.Types.ObjectId().toString(), Schema, collectionName);
    }
    return adHocModels[collectionName];
};

var toGeoJSON = function(obj) 
{
    if (obj.bbox && obj.bbox.length == 2) {
        // GeoJSON specifies a one-dimensional array for the bbox
        obj.bbox = obj.bbox.reduce(function(a, b) {
            return a.concat(b);
        });
    } else {
        delete obj.bbox;
    }
    return obj;
};


module.exports = {
	adHocModel: adHocModel,
	toGeoJSON: toGeoJSON
};