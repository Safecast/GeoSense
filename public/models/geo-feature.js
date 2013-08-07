define([
	'jquery',
	'underscore',
	'backbone',
    'deepextend',
    'deepmodel',
], function($, _, Backbone) {
    "use strict";

	var GeoFeature = Backbone.DeepModel.extend({
		
		idAttribute: "_id",

        initialize: function() 
        {
        },

        getNumericVal: function()
        {
            var attrMap = this.collection.mapLayer.getOption('attrMap', {});
            return attrMap.numeric ?
                this.get(attrMap.numeric) : undefined;
        },
        
        getCenter: function() 
        {
            var size = this.getSize();
            return [
                this.attributes.bbox[0] + size[0] / 2, 
                this.attributes.bbox[1] + size[1] / 2
            ];
        },

        getSize: function() 
        {
            return [
                this.attributes.bbox[2] - this.attributes.bbox[0],
                this.attributes.bbox[3] - this.attributes.bbox[1]
            ];
        },

        getBox: function()
        {
            var size = this.getSize(),
                hw = size[0] / 2.0,
                hh = size[1] / 2.0,
                c = this.getCenter(),
                e = c[0] - hw, s = c[1] - hh, w = c[0] + hw, n = c[1] + hh;
            return [ [w,s], [e,s], [e,n], [w,n] ];
        },
		
		getRenderAttributes: function()
		{
            var l = this.collection.mapLayer,
                options = l.getLayerOptions(),
                attrMap = this.collection.mapLayer.getOption('attrMap', {}),
                extremes = l.getMappedExtremes(),
                counts = l.getCounts(),
                val = this.getNumericVal(),
                maxVal = extremes.numeric ? extremes.numeric.max : NaN,
                minVal = extremes.numeric ? extremes.numeric.min : NaN;

            if (val && val.avg != null) {
                val = val.avg;
            }

            var count = this.attributes.count || 1,
                normVal = (val - minVal) / (maxVal - minVal),
                normCount = count / counts.max,
                color,
                colorType = val != undefined ? options.colorType : ColorType.SOLID,
                size;

            switch (colorType) {
                case ColorType.SOLID: 
                    color = l.colorAt(0);
                    break;
                case ColorType.LINEAR_GRADIENT:
                case ColorType.PALETTE:
                    var colorPos;
                    switch (attrMap.featureColor) {
                        case 'count':
                            color = l.colorAt(normCount);
                            break;
                        default:
                        case 'val.avg':
                            color = l.colorAt(normVal);
                            break;
                    }
                    break;
            }

            switch (attrMap.featureSize) {
                default:
                case 'count':
                    size = normCount;
                    break;
                case '$numeric.avg':
                    size = normVal;
                    break;
            };

            return {
                color: color,
                darkerColor: multRGB(color, .75),
                model: this,
                data: {
                    val: val,
                    normVal: normVal,
                    count: count,
                },
                size: size
            };

		}
	});

	return GeoFeature;
});