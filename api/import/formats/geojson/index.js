var json = require('../json'),
	config = require('../../../../config');

module.exports = {

    Parser: function() 
    {
        return json.Parser(['features', true]);
    },

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
