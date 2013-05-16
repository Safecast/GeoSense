var ParserBase = require('../').ParserBase,
	util = require('util'),
    XmlStream = require('xml-stream');

var XML = function()
{
	ParserBase.call(this);
};

util.inherits(XML, ParserBase);

XML.prototype.fromStream = function(readStream, options)
{
	var self = this,
		xmlStream = new XmlStream(readStream);

    xmlStream.pause = function() {
        readStream.pause();
    };

    xmlStream.resume = function() {
        readStream.resume();
    };

    xmlStream.on('error', function(err) { 
    	self.onReadStreamError(err, self);
    });
    
    xmlStream.on('end', function() {
    	self.onReadStreamEnd(self);
    });

	xmlStream.on('data', function(data) {
		//console.log('data', data);
	});

    this.readStream = xmlStream;
    return this;
}

module.exports = XML;
