var mongoose = require('mongoose'),
    coordinates = require('./coordinates'),
    util = require('./util'),
    _ = require('cloneextend');


var basicGeoFeatureCollectionSchema = {
        type: {type: String, required: true, enum: ['FeatureCollection'], default: 'FeatureCollection'},
        bounds: {type: Array/*, index: '2d'*/},
        properties: mongoose.Schema.Types.Mixed,
    },
    basicGeoFeatureSchema = {
        type: {type: String, /*required: true,*/ enum: ["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon", "GeometryCollection", "Feature", "FeatureCollection"], index: 1},
        bounds2d: {type: Array, index: '2d'},
        bounds: {type: Array},
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
    if (extraAttrs) obj = _.extend(obj, extraAttrs);
    delete obj.importParams;
    if (this.features) {
        obj.features = this.features.map(function(feature) {
            return feature.toGeoJSON();
        });
    }
    return obj;
};

GeoFeatureCollectionSchemaMethods.findFeaturesWithin = function(bounds2d, conditions, fields, options, callback)
{
    // from Mongoose find()
    if ('function' == typeof options) {
        callback = options;
        options = null;
    } else if ('function' == typeof fields) {
        callback = fields;
        fields = null;
        options = null;
    } else if ('function' == typeof conditions) {
        callback = conditions;
        conditions = {};
        fields = null;
        options = null;
    }

    var self = this,
        conditions = conditions || {},
        options = _.cloneextend(options || {}),
        modelOptions = {
            gridSize: options.gridSize,
            timebased: options.timebased
        };

    delete options.gridSize;
    delete options.timebased;
    options.mapReduce = modelOptions.gridSize || modelOptions.timebased;

    var Model = this.getFeatureModel(modelOptions);

    if (options.mapReduce) {
        // TODO remap conditions.* to conditions.value.*?
    }

    Model.findWithin(bounds2d, conditions, fields, options, function(err, docs) {
        if (err) {
            throw err;
        }
        console.log('Found features in', Model.collection.name, ':', docs.length);
        if (options.mapReduce && docs) {
            docs.forEach(function(doc) {
                var reduced = doc.get('value');
                for (var key in reduced) {
                    doc.set(key, reduced[key]);
                }
                doc.set('value', null); // TODO: does not work
            });
        }
        self.features = docs;
        if (callback) {
            callback(err, self, self.features);
        }
    });
}

GeoFeatureCollectionSchemaMethods.findFeatures = function(conditions, fields, options, callback)
{
    this.findFeaturesWithin(null, conditions, fields, options, callback);
};

GeoFeatureCollectionSchemaMethods.getFeatureModel = function(options)
{
    if (!this.FeatureSchema) {
        throw new Error('FeatureSchema not defined for ' + this.constructor.modelName);
    }
    var options = options || {},
        reduced = options.gridSize != undefined || options.timebased != undefined,
        collectionName = 
            (reduced ? 'r_' : '')
            + 'features_' + this._id
            + (options.gridSize != undefined ? '_tile_rect_' + options.gridSize : '')
            + (options.timebased != undefined ? '_' + options.timebased : '');

    var Model = util.adHocModel(collectionName, this.FeatureSchema);
    return Model;
}

function GeoFeatureCollectionSchema(extraSchema, extraMethods, extraStatics, extraMiddleware)
{
    var schema = new mongoose.Schema(_.cloneextend(basicGeoFeatureCollectionSchema, extraSchema || {}));
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
    // problem: since bounds now may contain coordinates that are the result of arithmetic
    // overflow, we have no way of telling how the original coordinates may be crossing 
    // the international dateline, hence re-calculate bounds:
    /*if (obj.bounds2d[0][0] > obj.bounds2d[1][0]) {
        obj.bounds2d = this.getBounds(false);
    }*/


    if (extraAttrs) obj = _.extend(obj, extraAttrs);
    delete obj.value; // TODO this is intransparent, but see above: doc.set('value', null); // TODO: does not work
    return util.toGeoJSON(obj);
};

GeoFeatureSchemaMethods.getBounds = function(overflow180) {
    return coordinates.getBounds(this.geometry.coordinates, overflow180);
};

GeoFeatureSchemaMethods.getCenter = function() {
    return coordinates.getBounds(this.bounds);
};

GeoFeatureSchemaMiddleware.pre = {
    save: function(next) {
        this.bounds = this.getBounds();
        this.bounds2d = coordinates.getBounds(this.bounds, true);
        next();
    }
};

GeoFeatureSchemaStatics.findWithin = function(bounds2d, conditions, fields, options, callback) 
{
    // from Mongoose find()
    if ('function' == typeof options) {
        callback = options;
        options = null;
    } else if ('function' == typeof fields) {
        callback = fields;
        fields = null;
        options = null;
    } else if ('function' == typeof conditions) {
        callback = conditions;
        conditions = {};
        fields = null;
        options = null;
    }

    var options = _.cloneextend(options || {}),
        conditions = _.cloneextend(conditions || {}),
        boundsField = options.mapReduce ? 'value.bounds2d' : 'bounds2d';

    if (bounds2d) {
        conditions[boundsField] = {
            $within: {
                $box: coordinates.getBounds(bounds2d)
            }
        };
    }
    delete options.mapReduce;

    console.info('Querying feature collection:', this.collection.name, 
        ' ( conditions:', conditions, ', fields:', fields, ', options:', options, ')');

    if (bounds2d) {
        console.warn('db["'+this.collection.name+'"].count({"'+boundsField+'":{$within:{$box:[['+
            bounds2d[0].toString()+'],['+bounds2d[1].toString()+']]}}})');
    }

    return this.find(conditions, fields, options, callback);
}

function GeoFeatureSchema(extraSchema, extraMethods, extraStatics, extraMiddleware)
{
    var schema = new mongoose.Schema(_.cloneextend(basicGeoFeatureSchema, extraSchema || {}));        
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
    return schema;
}


module.exports = {
    GeoFeatureCollectionSchema: GeoFeatureCollectionSchema,
    GeoFeatureSchema: GeoFeatureSchema
}