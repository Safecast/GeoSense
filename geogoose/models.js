var mongoose = require('mongoose'),
    coordinates = require('./coordinates'),
    util = require('./util'),
    getBounds = coordinates.getBounds, getBbox = coordinates.getBbox,
    _ = require('cloneextend');

var geoJSONFeatureCollectionDefinition = {
        type: {type: String, required: true, enum: ['FeatureCollection'], default: 'FeatureCollection'},
        bounds2d: {type: Array, index: '2d'},
        properties: mongoose.Schema.Types.Mixed,
    },
    geoJSONFeatureDefinition = {
        type: {type: String, /*required: true,*/ enum: ["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon", "GeometryCollection", "Feature", "FeatureCollection"], index: 1},
        bounds2d: {type: Array, index: '2d'},
        bbox: {type: Array},
        geometry: {
            type: {type: String, /*required: true,*/ enum: ["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon", "GeometryCollection"], index: 1},
            coordinates: {type: Array, /*required: true*/ index: 1}
        },
        properties: mongoose.Schema.Types.Mixed,
    },
    GeoFeatureCollectionSchemaMethods = {}, GeoFeatureCollectionSchemaStatics = {}, GeoFeatureCollectionSchemaMiddleware = {},
    GeoFeatureSchemaMethods = {}, GeoFeatureSchemaStatics = {}, GeoFeatureSchemaMiddleware = {};


GeoFeatureCollectionSchemaMethods.toGeoJSON = function(extraAttrs)
{
    var obj = util.toGeoJSON(this.toJSON());
    delete obj.importParams;
    if (extraAttrs) {
        for (var k in extraAttrs) {
            obj[k] = extraAttrs[k];
        }
    }
    if (obj.features) {
        obj.features = obj.features.map(function(feature) {
            return feature.toGeoJSON();
        });
    }
    return obj;
};

GeoFeatureCollectionSchemaMethods.getFeatureModel = function(options)
{
    var options = options || {},
        schema = options.schema || this.FeatureSchema,
        collectionName = options.collectionName || 'features_' + this._id;
    if (!schema) {
        throw new Error('FeatureSchema not defined for ' + this.constructor.modelName);
    }
    var Model = util.adHocModel(collectionName, schema);
    return Model;
}

function GeoFeatureCollectionSchema(extraDefinition, extraMethods, extraStatics, extraMiddleware, basicDefinition)
{
    var schema = new mongoose.Schema(_.cloneextend(basicDefinition || geoJSONFeatureCollectionDefinition, extraDefinition || {}));
    schema.methods = _.clone(GeoFeatureCollectionSchemaMethods);
    _.add(schema.methods, extraMethods);
    schema.statics = _.clone(GeoFeatureCollectionSchemaStatics);
    _.add(schema.statics, extraStatics);
    var middleware = _.cloneextend(GeoFeatureCollectionSchemaMiddleware, extraMiddleware || {});
    for (var method in middleware) {
        for (var evt in middleware[method]) {
            schema[method](evt, middleware[method][evt]);
        }
    }
    return schema;
}


GeoFeatureSchemaMethods.toGeoJSON = function(extraAttrs) 
{
    var obj = this.toJSON();
    delete obj.featureCollection;
    if (extraAttrs) obj = _.extend(obj, extraAttrs);
    return util.toGeoJSON(obj);
};

GeoFeatureSchemaMiddleware.pre = {
    save: function(next) {
        if (!this.type) this.type = 'Feature';
        if (this.geometry.coordinates && this.geometry.coordinates.length) {
            var bounds = getBounds(this.geometry.coordinates);
            // GeoJSON specifies a one-dimensional array for the bbox
            this.bbox = getBbox(bounds);
            // Store 2d-indexable bounds >= -180 and < 180
            this.bounds2d = getBounds(bounds, true);
        }
        if (next) next();
    }
};

GeoFeatureSchemaStatics.within = function(coordinates) 
{
    if (!this.schema.geoIndexField) {
        throw new Error('Schema has no geoIndexField defined');
    };
    var condition = {$within:
        Array.isArray(coordinates) ? 
            {$box: coordinates} 
        : coordinates
    };
    return this.where(this.schema.geoIndexField, condition);
}

function GeoFeatureSchema(extraDefinition, extraMethods, extraStatics, extraMiddleware, basicDefinition)
{
    var schema = new mongoose.Schema(_.cloneextend(basicDefinition || geoJSONFeatureDefinition, extraDefinition || {}));        
    schema.methods = _.clone(GeoFeatureSchemaMethods);
    _.add(schema.methods, extraMethods);
    schema.statics = _.clone(GeoFeatureSchemaStatics);
    _.add(schema.statics, extraStatics);
    var middleware = _.cloneextend(GeoFeatureSchemaMiddleware, extraMiddleware || {});
    for (var method in middleware) {
        for (var evt in middleware[method]) {
            schema[method](evt, middleware[method][evt]);
        }
    }

    // determine which field to use for 2d index queries:
    schema.indexes().forEach(function(index) {
        for (var k in index[0]) {
            if (index[0][k] == '2d') {
                schema.geoIndexField = k;
                break;
            }
        }
    });

    return schema;
}


module.exports = {
    GeoFeatureCollectionSchema: GeoFeatureCollectionSchema,
    GeoFeatureSchema: GeoFeatureSchema,
    GeoFeatureCollectionSchemaMiddleware: GeoFeatureCollectionSchemaMiddleware,
    GeoFeatureSchemaMiddleware: GeoFeatureSchemaMiddleware,
    geoJSONFeatureCollectionDefinition: geoJSONFeatureCollectionDefinition,
    geoJSONFeatureDefinition: geoJSONFeatureDefinition 
}