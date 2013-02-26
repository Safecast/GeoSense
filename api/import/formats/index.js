var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    fs = require('fs');

// Utils function
var merge = function(obj1, obj2){
    var r = obj1||{};
    for(var key in obj2){
        r[key] = obj2[key];
    }
    return r;
}

var ParserBase = function()
{
    EventEmitter.call(this);
    this.readOptions = {
        encoding: 'utf8'
    };
};

util.inherits(ParserBase, EventEmitter);

ParserBase.prototype.fromStream = function(readStream, options)
{
	var options = options || {};
    if (options) merge(this.readOptions, options);
    var self = this;
    readStream.on('data', function(data) { 
    	self.readStreamData(data, self);
    });
    readStream.on('error', function(err) { 
    	self.readStreamError(err, self);
    });
    readStream.on('end', function() {
    	self.readStreamEnd(self);
    });
    this.readStream = readStream;
    return this;
};

ParserBase.prototype.readStreamData = function(data) 
{
    try {
        this.parse(data);
    } catch (err) {
        this.emit('error', err);
        // Destroy the input stream
        this.readStream.destroy();
    }
};

ParserBase.prototype.readStreamError = function(err) 
{
	this.emit('error', err) 
};


ParserBase.prototype.readStreamEnd = function() {
	this.end(); 
};

ParserBase.prototype.end = function()
{
	this.emit('end');
}

ParserBase.prototype.parse = function()
{
	throw new Error('Your parser needs to implement parse() or override readStreamData()');
}

ParserBase.prototype.fromPath = function(path, options) 
{
	var options = options || {};
    if (options) merge(this.readOptions,options);
    var stream = fs.createReadStream(path, this.readOptions);
    stream.setEncoding(this.readOptions.encoding);
    return this.fromStream(stream, null);
};

module.exports = {
	ParserBase: ParserBase
};
