JSONStream = require('JSONStream'),
	request = require('request'),
	fs = require('fs');

module.exports = {
	Parser: function() 
	{
		var parser = JSONStream.parse(['features', true]);
		parser.fromStream = function(stream) {
			stream.pipe(this);
		}
		parser.fromPath = function(path) {
		    var readOptions = {
		        flags: 'r',
		        encoding: 'utf8',
		        bufferSize: 8 * 1024 * 1024,
		    };						        
		    var stream = fs.createReadStream(path, readOptions);
		    stream.setEncoding(readOptions.encoding);
		    return this.fromStream(stream);
		}
		return parser;
	},
	
	Request: function(opts) 
	{
		if (!opts.headers) {
			opts.headers = {};
		}
		if (!opts.headers.Accept) {
			opts.headers.Accept = 'application/json';
		}
		return request(opts);
	}
};

