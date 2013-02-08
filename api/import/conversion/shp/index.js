var conversion = require('../');

var fieldDefs = {
    type: {type: 'String'},
    geometry: {type: 'Object'},
    properties: {type: 'Object'}
};

module.exports = function() { return new conversion.Converter(fieldDefs); }