var	grid = require('./parsers/esri.grid.ascii.js'), 
	request = require('request');


module.exports = {
	Parser: grid,
	Request: function(opts) 
	{
		if (!opts.headers) {
			opts.headers = {};
		}
		if (!opts.headers.Accept) {
			opts.headers.Accept = 'text/*';
		}
		return request(opts);
	}
};



