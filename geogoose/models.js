var mongoose = require('mongoose'),
    coordinates = require('./coordinates'),
    util = require('./util'),
    getBounds = coordinates.getBounds, 
    bboxFromBounds = coordinates.bboxFromBounds,
    boundsFromBbox = coordinates.boundsFromBbox,
    _ = require('cloneextend');

var geoJSONFeatureCollectionDefinition = {
        type: {type: String, required: true, enum: ['FeatureCollection'], default: 'FeatureCollection'},
        geometry: {
            type: {type: String, enum: ["Polygon"]},
            coordinates: {type: Array },
        },
        bbox: {type: Array},
        properties: mongoose.Schema.Types.Mixed,
    },
    geoJSONFeatureDefinition = {
        type: {type: String, enum: ["Feature"], index: 1},
        geometry: {
            type: {type: String, enum: ["Point", "LineString", "Polygon"], regexp: 'asd'},
            coordinates: {type: Array },
        },
        bbox: {type: Array},
        properties: mongoose.Schema.Types.Mixed,
    },
    GeoFeatureCollectionSchemaMethods = {}, GeoFeatureCollectionSchemaStatics = {}, GeoFeatureCollectionSchemaMiddleware = {},
    GeoFeatureSchemaMethods = {}, GeoFeatureSchemaStatics = {}, GeoFeatureSchemaMiddleware = {};


GeoFeatureCollectionSchemaMiddleware.pre = {
    save: function(next) {

        // TODO: Save bbox / geometry for GeoFeatureColletion (also see api/import for correctly determining bounds)
        /*if (this.bbox && this.bbox.length) {
            // Store 2d-indexable bounds >= -180 and < 180
            var bounds = getBounds(boundsFromBbox(this.bbox));
            this.geometry = {
                type: "Polygon",
                coordinates: [[bounds]]
            }
        }*/

        if (next) next();
    }
};

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
        if (!this.geometry || !this.geometry.type || !this.geometry.coordinates || !this.geometry.coordinates.length) {
            this.geometry = undefined;
        }
        if (this.geometry.coordinates && this.geometry.coordinates.length) {
            var bounds = getBounds(this.geometry.coordinates);
            if (this.geometry.type != 'Point') {
                // GeoJSON specifies a one-dimensional array for the bbox
                this.bbox = bboxFromBounds(bounds);
            }
        }
        if (next) next();
    }
};

GeoFeatureSchemaStatics.geoIndexField = 'geometry';

GeoFeatureSchemaStatics.geoWithin = function(geometry) 
{
    if (!this.schema.statics.geoIndexField) {
        throw new Error('Schema has no geoIndexField defined');
    };
    var c = {$geoWithin: {$geometry: geometry}};
    return this.where(this.schema.statics.geoIndexField, c);
}

GeoFeatureSchemaStatics.geoIntersects = function(geometry) 
{
    if (!this.schema.statics.geoIndexField) {
        throw new Error('Schema has no geoIndexField defined');
    };
    var c = {$geoIntersects: {$geometry: geometry}};
    return this.where(this.schema.statics.geoIndexField, c);
}

function GeoFeatureSchema(extraDefinition, extraMethods, extraStatics, extraMiddleware, basicDefinition)
{
    var schema = new mongoose.Schema(_.cloneextend(basicDefinition || geoJSONFeatureDefinition, extraDefinition || {}));        
    schema.methods = _.clone(GeoFeatureSchemaMethods);
    _.extend(schema.methods, extraMethods);
    schema.statics = _.clone(GeoFeatureSchemaStatics);
    _.extend(schema.statics, extraStatics);
    var middleware = _.cloneextend(GeoFeatureSchemaMiddleware, extraMiddleware || {});
    for (var method in middleware) {
        for (var evt in middleware[method]) {
            schema[method](evt, middleware[method][evt]);
        }
    }

    if (!schema.statics.geoIndexField) {
        throw new Error('Schema has no geoIndexField defined');
    };

    var index = {};
    index[schema.statics.geoIndexField] = '2dsphere';
    schema.index(index);

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