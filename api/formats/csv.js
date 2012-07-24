var	csv = require('csv'),
	request = require('request');

module.exports = {
	Parser: csv,
	Request: function(opts) 
	{
		if (!opts.headers) {
			opts.headers = {};
		}
		if (!opts.headers.Accept) {
			opts.headers.Accept = 'text/csv';
		}
		return request(opts);
	}
};
