define([
	'jquery',
	'underscore',
	'backbone',
    'deepextend',
    'deepmodel',
], function($, _, Backbone) {
	var GeoFeature = Backbone.DeepModel.extend({
		
		idAttribute: "_id",

        initialize: function() 
        {
            // TODO: deprecated
            this.attributes.loc = this.getCenter();
            this.numericAttr = 'properties.numVal';
            this.attributes.val = this.getVal();
        },

        getVal: function()
        {
            return this.numericAttr ?
                this.get(this.numericAttr) : undefined;
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
                extremes = l.getExtremes(),
                min = extremes.minVal,
                max = extremes.maxVal,
                val = this.get('val'),
                colors = l.getNormalizedColors();

            if (val && val.avg != null) {
                val = val.avg;
            }

            var count = this.get('count'),
                normVal = (val - min) / (max - min),
                normCount = count / extremes.maxCount,
                color,
                colorType = val != null ? options.colorType : ColorType.SOLID,
                size;

            switch (colorType) {
                case ColorType.SOLID: 
                    color = colors[0].color;
                    break;
                case ColorType.LINEAR_GRADIENT:
                case ColorType.PALETTE:
                    var colorPos;
                    switch (options.featureColorAttr) {
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

            switch (options.featureSizeAttr) {
                default:
                case 'count':
                    size = normCount;
                    break;
                case 'val.avg':
                    size = normVal;
                    break;
            };

            return {
                color: color,
                darkerColor: multRGB(color, .75),
                min: min,
                max: max,
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