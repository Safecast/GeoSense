var ParserBase = require('../').ParserBase,
	util = require('util'),
	tj = require('togeojson'),
    jsdom = require('jsdom').jsdom;

var KML = function()
{
	ParserBase.call(this);
	this.kmlData = '';
};

util.inherits(KML, ParserBase);

KML.prototype.readStreamData = function(data) 
{
	this.kmlData += data;
};

KML.prototype.readStreamEnd = function()
{
	var self = this,
		converted = tj.kml(jsdom(this.kmlData), { styles: true });
	converted.features.forEach(function(feature) {
		self.emit('data', feature);
	});
	KML.super_.prototype.readStreamEnd.call(this);
}; 

module.exports = {
	KML: KML
};