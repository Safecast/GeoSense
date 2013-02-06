var utils = require('../../../utils.js'),
	console = require('../../../ext-console.js');

var ConversionError = function(msg) {
	this.message = msg;
};
this.ConversionError = ConversionError;

this.convertModel = function(fromModel, converter, toModel) {
	var doc = {};
	for (var destField in converter.fields) {
		var f = converter.fields[destField];
		doc[destField] = f.apply(fromModel, [doc]);
		if (doc[destField] instanceof ConversionError) {
			console.error('ConversionError on field ' + destField + ':', doc[destField].message);
			return false;
		} 
	}
	return new toModel(doc);
}
