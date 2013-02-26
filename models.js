var mongoose = require('mongoose'),
    config = require('./config.js');
    mongooseTypes = require("mongoose-types"),
    _ = require('cloneextend'),
    util = require('util');

var useTimestamps = function (schema, options) {
    schema.add({
        createdAt: Date
      , updatedAt: Date
    });
    schema.pre('save', function (next) {    
      if (!this.createdAt) {
        this.createdAt = this.updatedAt = new Date;
      } else {
        this.updatedAt = new Date;
      }
      next();
    });
};

mongooseTypes.loadTypes(mongoose);
//useTimestamps = mongooseTypes.useTimestamps;

var User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: {type: mongoose.SchemaTypes.Email, required: true}   
}));

User.schema.plugin(useTimestamps);

var Job = mongoose.model('Job', new mongoose.Schema({
    createdAt: Date,
    updatedAt: Date,
    type: {type: String, enum: [config.JobType.IMPORT, config.JobType.REDUCE], required: true},
    status: {type: String, enum: [config.JobStatus.ACTIVE, config.JobStatus.IDLE], required: true, default: config.MapLayerType.POINTS},
}));

Job.schema.plugin(useTimestamps);

var Point = mongoose.model('Point', new mongoose.Schema({
    pointCollection: { type: mongoose.Schema.ObjectId, ref: 'PointCollection', required: true, index: 1 },
    importJob: { type: mongoose.Schema.ObjectId, ref: 'Job', required: false, index: 1 },
    loc: {type: [Number], index: '2d', required: true },
    val: {type: Number, index: 1},
    label: String,
    description: String,
    url: String,
    datetime: {type: Date, index: 1},
    sourceId: {type: mongoose.Schema.Types.Mixed, index: 1},
    incField: {type: mongoose.Schema.Types.Mixed, index: 1},
    createdAt: Date,
    updatedAt: Date
}));

Point.schema.plugin(useTimestamps);
Point.schema.index({loc: '2d', pointCollection: 1})

var colorMatch = /^#([a-fA-F0-9]{2}){3}$/;

var LayerOptions = mongoose.model('LayerOptions', new mongoose.Schema({
    enabled: {type: Boolean, required: true, default: true},
    public: {type: Boolean, required: true, default: true},
    featureType: {type: String, required: true, enum: [
        config.FeatureType.POINTS, config.FeatureType.CELLS, config.FeatureType.BUBBLES, config.FeatureType.SHAPES]},
    colorType: {type: String, required: true, default: config.ColorType.LINEAR_GRADIENT},
    //colorPalettes: {type: [ColorPalette.schema], index: 1},
    colors: [{
        color: {type: String, required: true, match: colorMatch},
        position: {type: String, match: /^[0-9]+(\.[0-9]+)?%?$/},
        interpolation: {type: String, enum: ['lerpRGB', 'threshold', ''], required: false},
        label: String,
        description: String
    }],
    colorLabelColor: {type: String, match: colorMatch},
    reduction: String,
    opacity: {type: Number, required: true},
    featureSizeAttr: {type: String, enum: ['val.avg', 'count', ''], default: ''},
    featureColorAttr: {type: String, enum: ['val.avg', 'count', ''], default: ''},
    minFeatureSize: Number,
    maxFeatureSize: Number,
    datetimeFormat: String,
    valFormat: [{
        unit: {type: String, required: true},
        eq: {type: String, required: true},
        formatString: String
    }],
    filterQuery: mongoose.Schema.Types.Mixed,
    queryOptions: mongoose.Schema.Types.Mixed,
    title: String,
    unit: String,
    description: String,
    histogram: {type: Boolean, default: true},
    itemTitle: String,
    itemTitlePlural: String,
    cropDistribution: Boolean
}));

LayerOptions.schema.path('colors').validate(function (value) {
    return value.length > 0;
}, 'At least one color is required.');

PointCollection = mongoose.model('PointCollection', new mongoose.Schema({
    title: String,
    description: String,
    source: String,
    unit: String,
    isNumeric: {type: Boolean, default: true},
    maxVal: Number,
    minVal: Number,
    maxIncField: { type: mongoose.Schema.Types.Mixed, index: 1 },
    importParams: mongoose.Schema.Types.Mixed,
    timeBased: Boolean,
    gridSize: Number,
    defaults: { type: mongoose.Schema.ObjectId, ref: 'LayerOptions', index: 1 },
    active: Boolean,
    status: String,
    progress: Number,
    numBusy: Number,
    reduce: Boolean,
    maxReduceZoom: Number,
    sync: Boolean,
    cropDistribution: Boolean,
    createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', index: 1 },
    modifiedBy: { type: mongoose.Schema.ObjectId, ref: 'User', index: 1 },
    createdAt: Date,
    updatedAt: Date,
    lastReducedAt: Date,
    linkedPointCollection: { type: mongoose.Schema.ObjectId, ref: 'PointCollection', required: false, index: 1 },
}));

PointCollection.schema.plugin(useTimestamps);

var MapLayerSchema = new mongoose.Schema({
 //   _id: { type: mongoose.Schema.ObjectId },
    featureCollection: { type: mongoose.Schema.ObjectId, ref: 'GeoFeatureCollection', index: 1 },
    layerOptions: { type: mongoose.Schema.ObjectId, ref: 'LayerOptions', index: 1 },
    type: {type: String, enum: [config.MapLayerType.POINTS, config.MapLayerType.SHAPES], required: true, default: config.MapLayerType.POINTS},
    position: Number
});


var Map = mongoose.model('Map', new mongoose.Schema({
    active: {type: Boolean, default: true},
    title: {type: String, required: true},
    description: String,
    author: String,
    linkURL: String,
    linkTitle: String,
    twitter: String,
    displayInfo: Boolean,
    adminslug: {type: String, required: true, index: {unique: true}},
    publicslug: {type: String, required: true, index: {unique: true}},
    host: {type: String, required: false, index: {unique: true, sparse: true}},
    featured: {type: Number, default: 0}, 
    initialArea: {
        center: [Number, Number],
        zoom: Number
    },
    // TODO: Enforce privacy (currently unused because no user login required)
    status: {type: String, enum: [config.MapStatus.PRIVATE, config.MapStatus.PUBLIC], required: true, default: config.MapStatus.PUBLIC},
    layers: [MapLayerSchema],
    createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', index: 1 },
    modifiedBy: { type: mongoose.Schema.ObjectId, ref: 'User', index: 1 },
    createdAt: Date,
    updatedAt: Date,
    tour: {
        steps: [{
        layers: [Number],
        title: String,
        body: String
        }]
    }
}));

Map.schema.plugin(useTimestamps);

var adHocModels = {};

var adHocModel = function(collectionName, Schema) {
    if (!adHocModels[collectionName]) {
        var Schema = Schema || new mongoose.Schema({}, {strict: false});
        adHocModels[collectionName] = mongoose.model(
            new mongoose.Types.ObjectId().toString(), Schema, collectionName);
    }
    return adHocModels[collectionName];
}

function toGeoJSON() 
{
    var obj = this.toJSON();
    if (obj.bbox && obj.bbox.length) {
        obj.bbox = obj.bbox.reduce(function(a, b) {
            return a.concat(b);
        });
    } else {
        delete obj.bbox;
    }
    return obj;
}

function getBounds(coordinates) {
    if (!Array.isArray(coordinates) || !coordinates.length) {
        return;
    } else if (!Array.isArray(coordinates[0])) {
        coordinates = [coordinates];
    }
    return coordinates.reduce(function(a, b) {
        if (!Array.isArray(b)) return a;
        var bmax, bmin;
        if (Array.isArray(b[0])) {
            b = getBounds(b);
            bmin = b[0];
            bmax = b[1];
        } else {
            bmax = bmin = b;
        }
        if (bmin.length < 2 || bmax.length < 2) return a;
        bmin = bmin.map(clamp180); bmax = bmax.map(clamp180);
        return [
            [Math.min(bmin[0], a[0][0]), Math.min(bmin[1], a[0][1])],
            [Math.max(bmax[0], a[1][0]), Math.max(bmax[1], a[1][1])]
        ];
    }, [[Infinity, Infinity], [-Infinity, -Infinity]]);
}

var clamp180 = function(deg) 
{
    if (deg < -360 || deg > 360) {
        deg = deg % 360;    
    } 
    if (deg < -180) {
        deg = 180 + deg % 180;
    }
    if (deg > 180) {
        deg = -180 + deg % 180;
    }
    if (deg == 180) {
        deg = -180;
    }

    return deg;
};

var GeoFeatureCollectionSchema = new mongoose.Schema({
    type: {type: String, required: true, enum: ["FeatureCollection"], default: 'FeatureCollection'},
    bbox: {type: Array, index: '2d'},
    properties: mongoose.Schema.Types.Mixed,


    title: String,
    description: String,
    source: String,
    unit: String,
    isNumeric: {type: Boolean, default: true},
    extremes: { type: mongoose.Schema.Types.Mixed, index: 1 },
    importParams: mongoose.Schema.Types.Mixed,
    timeBased: Boolean,
    gridSize: Number,
    defaults: { type: mongoose.Schema.ObjectId, ref: 'LayerOptions', index: 1 },
    active: Boolean,
    status: String,
    progress: Number,
    numBusy: Number,
    reduce: Boolean,
    maxReduceZoom: Number,
    sync: Boolean,
    cropDistribution: Boolean,
    createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', index: 1 },
    modifiedBy: { type: mongoose.Schema.ObjectId, ref: 'User', index: 1 },
    createdAt: Date,
    updatedAt: Date,
    lastReducedAt: Date,
});

GeoFeatureCollectionSchema.plugin(useTimestamps);

GeoFeatureCollectionSchema.methods.toGeoJSON = function()
{
    var obj = toGeoJSON.call(this);
    delete obj.importParams;
    if (this.features) {
        obj.features = this.features.map(function(feature) {
            return feature.toGeoJSON();
        });
    }
    return obj;
};

GeoFeatureCollectionSchema.methods.findFeaturesWithin = function(bbox, conditions, fields, options, callback)
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

    var conditions = conditions || {};
    if (conditions.geocoded == undefined) {
        conditions.geocoded = true;
    }
    conditions.featureCollection = this;

    var self = this;
    this.getFeatureModel().findWithin(bbox, conditions, fields, options, function(err, documents) {
        self.features = documents;
        if (callback) {
            callback(err, self);
        }
    });
}

GeoFeatureCollectionSchema.methods.findFeatures = function(conditions, fields, options, callback)
{
    this.findFeaturesWithin(null, conditions, fields, options, callback);
};

GeoFeatureCollectionSchema.methods.getFeatureModel = function()
{
    return adHocModel('features_' + this._id, GeoFeatureSchema);
}

var GeoFeatureCollection = mongoose.model('GeoFeatureCollection', GeoFeatureCollectionSchema);

var GeoFeatureSchema = new mongoose.Schema({
    featureCollection: { type: mongoose.Schema.ObjectId, ref: 'GeoFeatureCollection', required: true, index: 1 },
    type: {type: String, /*required: true,*/ enum: ["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon", "GeometryCollection", "Feature", "FeatureCollection"], index: 1},
    bbox: {type: Array, index: '2d'},
    geocoded: {type: Boolean, default: false, required: true},
    geometry: {
        type: {type: String, /*required: true,*/ enum: ["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon", "GeometryCollection"], index: 1},
        coordinates: {type: Array, /*required: true*/ index: 1}
    },
    properties: mongoose.Schema.Types.Mixed,
    incrementor: mongoose.Schema.Types.Mixed,
    source: mongoose.Schema.Types.Mixed
/*        validate: function(val) {
            return typeof(val) == 'object'
                && (!val.val || !isNaN(val.val))
                && (!val.label || typeof val.label == 'string')
                && (!val.datetime || util.isDate(val.datetime))
                && (!val.color || typeof val.color == 'string' && val.color.match(colorMatch));
        }
    }*/
});
GeoFeatureSchema.methods.toGeoJSON = toGeoJSON;
GeoFeatureSchema.methods.getBounds = function() {
    return getBounds(this.geometry.coordinates);
};
GeoFeatureSchema.plugin(useTimestamps);
GeoFeatureSchema.index({bbox: '2d', featureCollection: 1});
GeoFeatureSchema.index({'properties.val': 1});
GeoFeatureSchema.index({'properties.label': 1});
GeoFeatureSchema.pre('save', function (next) {
    this.bbox = this.getBounds();
    this.geocoded = this.bbox && this.bbox.length;
    next();
});

GeoFeatureSchema.statics.findWithin = function(bbox, conditions, fields, options, callback) 
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

    if (bbox) {
        var conditions = _.cloneextend(conditions || {}, {
            bbox: {
                $within: {
                    $box: getBounds(bbox)
                }
            }
        });
    }

    return this.find(conditions, fields, options, callback);
}

//var GeoFeature = mongoose.model('GeoFeature', GeoFeatureSchema);

module.exports = {
    User: User, 
    Job: Job, 
    Point: Point, 
    LayerOptions: LayerOptions, 
    PointCollection: PointCollection, 
    Map: Map,
    GeoFeatureCollection: GeoFeatureCollection,
    //GeoFeature: GeoFeature,
    getBounds: getBounds
};
