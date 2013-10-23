var mongoose = require('mongoose'),
    coordinates = require('./coordinates'),
    util = require('./util'),
    getBounds = coordinates.getBounds, 
    bboxFromBounds = coordinates.bboxFromBounds,
    boundsFromBbox = coordinates.boundsFromBbox,
    _ = require('underscore');

var geoJSONFeatureCollectionDefinition = {
        type: {type: String, required: true, enum: ['FeatureCollection'], default: 'FeatureCollection'},
        bounds: {
            type: {type: String, enum: ["LineString"]},
            coordinates: {type: Array},
        },
        bbox: {type: Array},
        properties: mongoose.Schema.Types.Mixed,
    },
    geoJSONFeatureDefinition = {
        type: {type: String, enum: ["Feature"], index: 1},
        geometry: {
            type: {type: String, enum: ["Point", "LineString", "Polygon"]},
            coordinates: {type: Array},
        },
        sourceGeometry: mongoose.Schema.Types.Mixed,
        bbox: {type: Array},
        properties: mongoose.Schema.Types.Mixed,
    },
    GeoFeatureCollectionSchemaMethods = {}, GeoFeatureCollectionSchemaStatics = {}, GeoFeatureCollectionSchemaMiddleware = {},
    GeoFeatureSchemaMethods = {}, GeoFeatureSchemaStatics = {
        complexGeometryTypes: ["MultiPoint", "MultiLineString", "MultiPolygon"]
    }, GeoFeatureSchemaMiddleware = {};


GeoFeatureCollectionSchemaMiddleware.pre = {
    save: function(next) {

        if (this.bbox && this.bbox.length) {
            this.bounds = coordinates.lineStringFromBbox(this.bbox);
        } else {
            this.bbox = undefined;
            this.bounds = undefined;
        }

        if (next) next();
    }
};

GeoFeatureCollectionSchemaStatics.geoIndexField = 'bounds';

GeoFeatureCollectionSchemaMethods.toGeoJSON = function(extraAttrs)
{
    var obj = {
        _id: this._id,
        type: this.get('type'),
        properties: util.fieldsToObject(this, ['title', 'createdAt', 'updatedAt']),
        bbox: this.get('bbox')
    };

    if (extraAttrs) {
        obj.properties = _.extend(obj.properties, extraAttrs.properties);
        if (extraAttrs.features) {
            obj.features = extraAttrs.features.map(function(feature) {
                return feature.toGeoJSON();
            });
        }
        if (extraAttrs.bbox) {
            obj.bbox = extraAttrs.bbox;
        }
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
    var schema = new mongoose.Schema(_.extend(_.clone(basicDefinition || geoJSONFeatureCollectionDefinition), extraDefinition || {}));
    schema.methods = _.extend(_.clone(GeoFeatureCollectionSchemaMethods), extraMethods);
    schema.statics = _.extend(_.clone(GeoFeatureCollectionSchemaStatics), extraStatics);
    var middleware = _.extend(_.clone(GeoFeatureCollectionSchemaMiddleware), extraMiddleware || {});
    for (var method in middleware) {
        for (var evt in middleware[method]) {
            schema[method](evt, middleware[method][evt]);
        }
    }

    if (schema.statics.geoIndexField) {
        var index = {};
        index[schema.statics.geoIndexField] = '2dsphere';
        schema.index(index);
    };

    return schema;
}


GeoFeatureSchemaMethods.toGeoJSON = function(extraAttrs) 
{
    var obj = {
        _id: (this._id && this._id.toString ? this._id.toString() : this._id),
        type: this.get('type'),
        properties: this.get('properties')
    };

    if (this.sourceGeometry) {
        obj.geometry = this.get('sourceGeometry');
    } else if (this.geometry && this.geometry.type) {
        obj.geometry = this.get('geometry');
    }
    if (this.bbox && this.bbox.length) {
        obj.bbox = this.get('bbox');
    }
    if (extraAttrs) {
        for (var k in extraAttrs) {
            _.extend(obj[k], extraAttrs[k]);
        }
    }
    return obj;
};

GeoFeatureSchemaMethods.getBounds = function() 
{
    if (this.bbox && this.bbox.length) {
        return coordinates.boundsFromBbox(this.bbox);
    }
    if (this.geometry.type == 'Point') {
        return [this.geometry.coordinates, this.geometry.coordinates];
    }
}

GeoFeatureSchemaMiddleware.pre = {

    validate: function(next) {
        if (!this.schema.statics.geoIndexField) {
            throw new Error('Schema has no geoIndexField defined');
        };

        var geometryTypes = this.schema.paths[this.schema.statics.geoIndexField + '.type'].enumValues,
            complexGeometryTypes = this.schema.statics.complexGeometryTypes,
            geometryType = this[this.schema.statics.geoIndexField].type;

        if ((-1 == geometryTypes.indexOf(geometryType))
            && (-1 != complexGeometryTypes.indexOf(geometryType))) {
                //console.warn('Converting complex geometry to 2dsphere indexable bounds');
                this.sourceGeometry = _.clone(this.get('geometry'));
                this.geometry = coordinates.polygonFromBounds(getBounds(this.geometry.coordinates));
        }

        if (next) next();
    },

    save: function(next) {
        if (!this.type) this.type = 'Feature';
        if (!this.geometry || !this.geometry.type || !this.geometry.coordinates || !this.geometry.coordinates.length) {
            this.geometry = undefined;
        }
        if (this.geometry.type != 'Point' && this.geometry.coordinates && this.geometry.coordinates.length) {
            if (!this.bbox || !this.bbox.length) {
                var bounds = getBounds(this.geometry.coordinates);
                if (bounds) {
                    this.bbox = bboxFromBounds(bounds);
                }
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

GeoFeatureSchemaStatics.near = function(geometry, maxDistance) 
{
    if (!this.schema.statics.geoIndexField) {
        throw new Error('Schema has no geoIndexField defined');
    };
    var c = {$near: {$geometry: geometry, $maxDistance: maxDistance}};
    return this.where(this.schema.statics.geoIndexField, c);
}

function GeoFeatureSchema(extraDefinition, extraMethods, extraStatics, extraMiddleware, basicDefinition)
{
    var schema = new mongoose.Schema(_.extend(_.clone(basicDefinition || geoJSONFeatureDefinition), extraDefinition || {}));        
    schema.methods = _.clone(GeoFeatureSchemaMethods);
    _.extend(schema.methods, extraMethods);
    schema.statics = _.clone(GeoFeatureSchemaStatics);
    _.extend(schema.statics, extraStatics);
    var middleware = _.extend(_.clone(GeoFeatureSchemaMiddleware), extraMiddleware || {});
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