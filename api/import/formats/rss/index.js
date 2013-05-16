var parser = require('./parser'),
    request = require('request');

module.exports = {

    Parser: function() 
    {
        return new parser();
    },

    Request: function(opts) 
    {
        if (!opts.headers) opts.headers = {};
        if (!opts.headers.Accept) opts.headers.Accept = 'application/kml,text/kml';
        return request(opts);
    },

    transform: [
        {to: 'properties', type: 'Object'},
        {to: 'type', type: 'String'},
        {to: 'geometry', type: 'Object'},
    ]

};
