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
        bbox: {type: Array, index: '2d'},
        geometry: {
            type: {type: String, /*required: true,*/ enum: ["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon", "GeometryCollection"], index: 1},
            coordinates: {type: Array, /*required: true*/ index: 1}
        },
        properties: mongoose.Schema.Types.Mixed,
    },
    GeoFeatureCollectionSchemaMethods = {}, GeoFeatureCollectionSchemaStatics = {},
    GeoFeatureSchemaMethods = {}, GeoFeatureSchemaStatics = {}, GeoFeatureSchemaPre = {};


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

GeoFeatureCollectionSchemaMethods.findFeaturesWithin = function(bbox, conditions, fields, options, callback)
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

    if (!options.mapReduce) {
        if (conditions.geocoded == undefined) {
        //    conditions.geocoded = true;
        }
        //conditions['featureCollection'] = this;
    } else {
        //conditions['value.featureCollection'] = this;
    }

    Model.findWithin(bbox, conditions, fields, options, function(err, docs) {
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
            callback(err, self);
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

function GeoFeatureCollectionSchema(extraSchema, FeatureSchema)
{
    var schema = new mongoose.Schema(_.cloneextend(basicGeoFeatureCollectionSchema, extraSchema || {}));
    schema.methods = _.clone(GeoFeatureCollectionSchemaMethods);
    schema.methods.FeatureSchema = FeatureSchema;
    schema.statics = _.clone(GeoFeatureCollectionSchemaStatics);
    return schema;
}


GeoFeatureSchemaMethods.toGeoJSON = function(extraAttrs) 
{
    var obj = this.toJSON();
    // problem: since bbox is now overflown, we have no way of telling
    // whether the original coordinates crossed the dateline, hence re-calculate the bbox
    if (obj.bbox[0][0] > obj.bbox[1][0]) {
        obj.bbox = this.getBounds(false);
    }


    if (extraAttrs) obj = _.extend(obj, extraAttrs);
    delete obj.value; // TODO this is intransparent, but see above: doc.set('value', null); // TODO: does not work
    return util.toGeoJSON(obj);
};

GeoFeatureSchemaMethods.getBounds = function(overflow180) {
    return coordinates.getBounds(this.geometry.coordinates, overflow180);
};

GeoFeatureSchemaMethods.getCenter = function() {
    return coordinates.getBounds(this.bbox);
};

GeoFeatureSchemaPre.save = function(next) {
    this.bbox = this.getBounds(true);
    this.geocoded = this.bbox && this.bbox.length;
    next();
};

GeoFeatureSchemaStatics.findWithin = function(bbox, conditions, fields, options, callback) 
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
        bboxField = options.mapReduce ? 'value.bbox' : 'bbox';

    if (bbox) {
        conditions[bboxField] = {
            $within: {
                $box: coordinates.getBounds(bbox)
            }
        };
    }
    delete options.mapReduce;

    console.info('Querying feature collection:', this.collection.name, 
        ' ( conditions:', conditions, ', fields:', fields, ', options:', options, ')');

    if (bbox) {
        console.warn('db["'+this.collection.name+'"].count({"'+bboxField+'":{$within:{$box:[['+
            bbox[0].toString()+'],['+bbox[1].toString()+']]}}})');
    }

    return this.find(conditions, fields, options, callback);
}

function GeoFeatureSchema(extraSchema)
{
    var schema = new mongoose.Schema(_.cloneextend(basicGeoFeatureSchema, extraSchema || {}));        
    schema.methods = _.clone(GeoFeatureSchemaMethods);
    schema.statics = _.clone(GeoFeatureSchemaStatics);
    for (var k in GeoFeatureSchemaPre) {
        schema.pre(k, GeoFeatureSchemaPre[k]);
    }
    return schema;
}


module.exports = {
    GeoFeatureCollectionSchema: GeoFeatureCollectionSchema,
    GeoFeatureSchema: GeoFeatureSchema
}