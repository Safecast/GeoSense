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
        if (!opts.headers.Accept) opts.headers.Accept = 'application/xml,text/xml';
        return request(opts);
    },

    transform: [
    ]

};
