var parser = require('./parser');

module.exports = {

    Parser: function() 
    {
        return new parser.KML();
    },
    Request: function(opts) 
    {
    },

    transform: [
        {to: 'properties', type: 'Object'},
        {to: 'type', type: 'String', options: { skipEmpty: true } },
        {to: 'geometry', type: 'Object', options: { skipEmpty: true } },
        {to: 'properties', type: 'Object'}
    ]

};

