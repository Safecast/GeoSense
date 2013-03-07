var	grid = require('./parser'), 
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
	},

	transform: [
		{ to: 'geometry.coordinates', from: 'coordinates', type: 'LngLat' },
		{ to: 'geometry.type', set: 'Point' }
		{ to: 'properties.val', from: 'val', type: 'Number' },
		{ to: 'type', set: 'Point' },
	]

};
