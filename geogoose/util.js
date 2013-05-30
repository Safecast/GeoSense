var mongoose = require('mongoose'),
    _ = require('cloneextend'),
    adHocModels = {};


var adHocModel = function(collectionName, Schema, options) {
    if (!adHocModels[collectionName]) {
        var options = options || {};
        if (options.strict == undefined) {
            options.strict =  false;
        }
        var Schema = Schema || new mongoose.Schema({}, options);
        adHocModels[collectionName] = mongoose.model(
            'adhoc_' + new mongoose.Types.ObjectId().toString(), Schema, collectionName);
    }
    return adHocModels[collectionName];
};

/*
Modifies the JSON object to be sent to the client as GeoJSON 
*/
var toGeoJSON = function(obj) 
{
    delete obj.bounds2d;
    return obj;
};


module.exports = {
	adHocModel: adHocModel,
	toGeoJSON: toGeoJSON
};