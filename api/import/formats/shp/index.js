var Parser = require('./parser'),
	Shp = require('shp'),
	request = require('request');

module.exports = {
	Parser: function() 
	{
		return new Parser();
	},
	
	Request: function(opts) 
	{
	}
};

