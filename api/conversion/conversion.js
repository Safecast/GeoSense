var utils = require('../../utils.js'),
	console = require('../../ext-console.js');

var ConversionError = function() {};
this.ConversionError = ConversionError;

this.convertModel = function(fromModel, converters, toModel) {
	var doc = {};
	for (var destField in converters.fields) {
		var f = converters.fields[destField];
		doc[destField] = f.apply(fromModel);
		if (doc[destField] instanceof ConversionError) {
			console.error('ConversionError on field '+destField);
			return false;
		} 
	}
	return new toModel(doc);
}
