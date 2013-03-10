var util = require('./util');

var Document = function(doc) {
	this.doc = doc;
};

Document.prototype.toObject = function() {
	return this.doc;	
};

Document.prototype.get = function(attr) {
	return util.getAttr(this.doc, attr);
};

Document.prototype.set = function(attr, value) {
	util.setAttr(this.doc, attr, value);
};

module.exports = Document;