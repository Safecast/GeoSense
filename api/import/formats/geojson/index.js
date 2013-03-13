var json = require('../json'),
	config = require('../../../../config');

module.exports = {

    Parser: json.Parser,
    Request: json.Request,

    transform: [
        {to: 'properties', type: 'Object'},
        {to: 'type', type: 'String'},
        {to: 'geometry', type: 'Object'},
    ],

    defaults: {
    	featureType: config.FeatureType.SHAPES
    }

};
