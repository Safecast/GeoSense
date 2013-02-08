var util = require('util'),
	EventEmitter = require('events').EventEmitter,
    fs = require('fs'),
	shp = require('shp');

var Shp = function() {
	EventEmitter.call(this);
}
util.inherits(Shp, EventEmitter);

// TODO: needs fromStream 

Shp.prototype.fromStream = function(stream) {
}

Shp.prototype.fromPath = function(path) {
	var shpJson = shp.readFileSync(path);
	var l = shpJson.features.length;
	for (var i = 0; i < l; i++) {
		this.emit('data', shpJson.features[i]);
	}
	this.emit('end');
}

module.exports = Shp;