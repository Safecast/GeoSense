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
            });
        },

        getNumericVal: function()
        {
            var field = this.collection.mapLayer.getNumericField();
            return field ?
                this.get(field) : undefined;
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
                w = c[0] - hw, s = c[1] - hh, e = c[0] + hw, n = c[1] + hh;
            return [ [w,s], [e,s], [e,n], [w,n] ];
        },

		getRenderAttr: function(attrName, defaultValue)
		{
            // attrs already cached? if not, calculate them:
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
                            case '$numeric.avg':
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
                    size: size,
                    color: color,
                    model: this,
                    data: {
                        val: val,
                        normVal: normVal,
                        count: count,
                    }
                };
            }

            // return all attrs if no attrName passed, 
            if (!attrName) {
                return this._renderAttrs;
            }

            // or return one attr with an optional callback or default value if it is undefined
            if (this._renderAttrs[attrName] == undefined && defaultValue != undefined) {
                this._renderAttrs[attrName] = typeof defaultValue == 'function' ?
                    defaultValue() : defaultValue;
            }
            return this._renderAttrs[attrName];

		}
	});

	return GeoFeature;
});