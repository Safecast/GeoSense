var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    fs = require('fs');


var merge = function(obj1, obj2){
    var r = obj1||{};
    for(var key in obj2){
        r[key] = obj2[key];
    }
    return r;
}


var ParserBase = function(options)
{
    EventEmitter.call(this);
    this.readOptions = {
        encoding: 'utf8'
    };
};

util.inherits(ParserBase, EventEmitter);

ParserBase.prototype.fromStream = function(readStream, options)
{
    var self = this;
	   options = options || {};
    if (options) merge(this.readOptions, options);
    if (this.readOptions.encoding) {
        readStream.setEncoding(this.readOptions.encoding);
    }
    readStream.on('data', function(data) { 
    	self.onReadStreamData(data, self);
    });
    readStream.on('error', function(err) { 
    	self.onReadStreamError(err, self);
    });
    readStream.on('end', function() {
    	self.onReadStreamEnd(self);
    });
    this.readStream = readStream;
    return this;
};

ParserBase.prototype.copyFields = function(fields, from, to) {
    fields.forEach(function(field) {
        to[field] = from[field];
    });
};

ParserBase.prototype.onReadStreamData = function(data) 
{
    try {
        this.parse(data);
    } catch (err) {
        this.emit('error', err);
        // Destroy the input stream
        this.readStream.destroy();
    }
};

ParserBase.prototype.onReadStreamError = function(err) 
{
	this.emit('error', err) 
};


ParserBase.prototype.onReadStreamEnd = function() 
{
	this.end(); 
};

ParserBase.prototype.end = function()
{
	this.emit('end');
}

ParserBase.prototype.parse = function()
{
	throw new Error('Your parser needs to implement parse() or override onReadStreamData()');
}

ParserBase.prototype.fromPath = function(path, options) 
{
	var options = options || {};
    if (options) merge(this.readOptions, options);
    var stream = fs.createReadStream(path, this.readOptions);
    return this.fromStream(stream, null);
};


module.exports = ParserBase;