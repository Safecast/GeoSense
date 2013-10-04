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
            var self = this;
            this.on('change', function() {
                delete self._renderAttrs;
                console.log('delete');
            });
        },

        getNumericVal: function()
        {
            var attrMap = this.collection.mapLayer.getOption('attrMap', {});
            return attrMap.numeric ?
                this.get(attrMap.numeric) : undefined;
        },

        getDatetimeVal: function()
        {
            var attrMap = this.collection.mapLayer.getOption('attrMap', {});
            return attrMap.datetime ?
                this.get(attrMap.datetime) : undefined;
        },
        
        getCenter: function() 
        {
            if (!this.attributes.bbox || !this.attributes.bbox.length) {
                return this.attributes.geometry.coordinates;
            }
            var size = this.getSize();
            return [
                this.attributes.bbox[0] + size[0] / 2, 
                this.attributes.bbox[1] + size[1] / 2
            ];
        },

        getSize: function() 
        {
            if (!this.attributes.bbox || !this.attributes.bbox.length) {
                return [0, 0];
            }
            return [
                this.attributes.bbox[2] - this.attributes.bbox[0],
                this.attributes.bbox[3] - this.attributes.bbox[1]
            ];
        },

        getBox: function()
        {
            var size, gridSize = this.collection.mapLayer.mapFeatures.gridSize();
            if (this.attributes.geometry.type == 'Point' && gridSize) {
                size = gridSize;
            } else {
                size = this.getSize();
            }
            var hw = size[0] / 2.0,
                hh = size[1] / 2.0,
                c = this.getCenter(),
                e = c[0] - hw, s = c[1] - hh, w = c[0] + hw, n = c[1] + hh;
            return [ [w,s], [e,s], [e,n], [w,n] ];
        },

		getRenderAttributes: function(attrName)
		{
            if (!this._renderAttrs) {
                var l = this.collection.mapLayer,
                    options = l.getLayerOptions(),
                    attrMap = this.collection.mapLayer.getOption('attrMap', {}),
                    extremes = l.getMappedExtremes(),
                    counts = l.mapFeatures.getCounts(),
                    val = this.getNumericVal(),
                    maxVal = extremes.numeric ? extremes.numeric.max : NaN,
                    minVal = extremes.numeric ? extremes.numeric.min : NaN;

                if (val && val.avg != null) {
                    val = val.avg;
                }

                var count = this.attributes.properties ? this.attributes.properties.count || 1 : 1,
                    normVal = (val - minVal) / (maxVal - minVal),
                    normCount = count / (counts ? counts.max : 1),
                    color,
                    size;

                switch (options.colorType) {
                    default:
                        switch (attrMap.featureColor) {
                            case 'count':
                                color = l.colorAt(normCount);
                                break;
                            default:
                            case 'val.avg':
                                color = l.colorAt(!isNaN(normVal) ? normVal : 0);
                                break;
                        }
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

                this._renderAttrs = {
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

            if (!attrName) {
                return this._renderAttrs;
            }
            return this._renderAttrs[attrName];

		}
	});

	return GeoFeature;
});