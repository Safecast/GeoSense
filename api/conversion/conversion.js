var ConversionError = function() {};
this.ConversionError = ConversionError;

this.convertModel = function(fromModel, converters, toModel) {
	var doc = {};
	for (var destField in converters.fields) {
		var f = converters.fields[destField];
		doc[destField] = f.apply(fromModel);
		if (doc[destField] instanceof ConversionError) {
			console.log('ConversionError on field '+destField);
			return false;
		} 
	}
	return new toModel(doc);
}
