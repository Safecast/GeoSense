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
            'adhoc_' + new mongoose.Types.ObjectId().toString(), Schema, collectionName);
    }
    return adHocModels[collectionName];
};

var fieldsToObject = function(model, fields) {
    var values = {};
    fields.forEach(function(field) {
        values[field] = model.get(field);
    });
    return values;
}

module.exports = {
	adHocModel: adHocModel,
    fieldsToObject: fieldsToObject
};