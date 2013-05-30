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

var toGeoJSON = function(obj) 
{
    var gj = _.clone(obj);
    /*if (!obj.bbox && obj.bounds && obj.bounds.length == 2) {
        obj.bbox = obj.bounds.reduce(function(a, b) {
            return a.concat(b);
        });
    } */
    delete gj.bounds2d;
    return gj;
};


module.exports = {
	adHocModel: adHocModel,
	toGeoJSON: toGeoJSON
};