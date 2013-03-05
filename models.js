var config = require('./config'),
    c2d = require('./coordinates2d'),
    console = require('./ext-console'),
    mongoose = require('mongoose'),
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

/*
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
*/

var colorMatch = /^#([a-fA-F0-9]{2}){3}$/;

var LayerOptions = mongoose.model('LayerOptions', new mongoose.Schema({
    htmlRenderer: {type: String, required: false, default: "", enum: ["", "Canvas", "SVG"]},
    enabled: {type: Boolean, required: true, default: true},
    public: {type: Boolean, required: true, default: true},
    featureType: {type: String, required: true, enum: [
        config.FeatureType.POINTS, config.FeatureType.SQUARE_TILES, config.FeatureType.BUBBLES, config.FeatureType.SHAPES]},
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
    strokeColor: {type: String, match: colorMatch},
    reduction: String,
    opacity: {type: Number, required: true, min: 0, max: 1},
    strokeOpacity: {type: Number, min: 0, max: 1},
    strokeWidth: {type: Number, min: config.MIN_STROKE_WIDTH, max: config.MAX_STROKE_WIDTH},
    strokeDashstyle: {type: String},
    strokeLinecap: {type: String},
    featureSizeAttr: {type: String},
    featureColorAttr: {type: String},
    numericAttr: {type: String},
    datetimeAttr: {type: String},
    featureSize: {type: Number, min: config.MIN_FEATURE_SIZE, max: config.MAX_FEATURE_SIZE},
    minFeatureSize: {type: Number, min: config.MIN_FEATURE_SIZE, max: config.MAX_FEATURE_SIZE},
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

/*
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
    timebased: Boolean,
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
*/

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
    viewOptions: {
        viewName: String,
        viewBase: String,
        viewStyle: String
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

var adHocModel = function(collectionName, Schema, options) {
    if (!adHocModels[collectionName]) {
        var options = options || {};
        if (options.strict == undefined) {
            options.strict =  false;
        }
        var Schema = Schema || new mongoose.Schema({}, options);
        adHocModels[collectionName] = mongoose.model(
            new mongoose.Types.ObjectId().toString(), Schema, collectionName);
    }
    return adHocModels[collectionName];
}

function toGeoJSON(obj) 
{
    if (obj.bbox && obj.bbox.length == 2) {
        // GeoJSON specifies a one-dimensional array for the bbox
        obj.bbox = obj.bbox.reduce(function(a, b) {
            return a.concat(b);
        });
    } else {
        delete obj.bbox;
    }
    return obj;
}

var GeoFeatureCollectionSchema = new mongoose.Schema({
    type: {type: String, required: true, enum: ["FeatureCollection"], default: 'FeatureCollection'},
    bbox: {type: Array/*, index: '2d'*/},
    properties: mongoose.Schema.Types.Mixed,

    title: String,
    description: String,
    source: String,
    unit: String,
    isNumeric: {type: Boolean, default: true},
    extremes: { type: mongoose.Schema.Types.Mixed, index: 1, default: {} },
    importParams: mongoose.Schema.Types.Mixed,
    timebased: Boolean,
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
    datetimeAttr: String,
    numericAttr: String
});

GeoFeatureCollectionSchema.plugin(useTimestamps);

GeoFeatureCollectionSchema.methods.toGeoJSON = function(extraAttrs)
{
    var obj = toGeoJSON(this.toJSON());
    if (extraAttrs) obj = _.extend(obj, extraAttrs);
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

GeoFeatureCollectionSchema.methods.findFeatures = function(conditions, fields, options, callback)
{
    this.findFeaturesWithin(null, conditions, fields, options, callback);
};

GeoFeatureCollectionSchema.methods.getFeatureModel = function(options)
{
    var options = options || {},
        reduced = options.gridSize != undefined || options.timebased != undefined,
        collectionName = 
            (reduced ? 'r_' : '')
            + 'features_' + this._id
            + (options.gridSize != undefined ? '_tile_rect_' + options.gridSize : '')
            + (options.timebased != undefined ? '_' + options.timebased : '');

    var Model = adHocModel(collectionName, GeoFeatureSchema);
    return Model;
}

var GeoFeatureCollection = mongoose.model('GeoFeatureCollection', GeoFeatureCollectionSchema);

var GeoFeatureSchema = new mongoose.Schema({
    //featureCollection: { type: mongoose.Schema.ObjectId, ref: 'GeoFeatureCollection', required: true, index: 1 },
    type: {type: String, /*required: true,*/ enum: ["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon", "GeometryCollection", "Feature", "FeatureCollection"], index: 1},
    bbox: {type: Array, index: '2d'},
    geocoded: {type: Boolean, default: false, required: true},
    geometry: {
        type: {type: String, /*required: true,*/ enum: ["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon", "GeometryCollection"], index: 1},
        coordinates: {type: Array, /*required: true*/ index: 1}
    },
    properties: mongoose.Schema.Types.Mixed,
    incrementor: mongoose.Schema.Types.Mixed,
    source: mongoose.Schema.Types.Mixed,
    count: Number   
});
GeoFeatureSchema.methods.toGeoJSON = function(extraAttrs) 
{
    var obj = this.toJSON();
    // problem: since bbox is now overflown, we have no way of telling
    // whether the original coordinates crossed the dateline, hence re-calculate the bbox
    if (obj.bbox[0][0] > obj.bbox[1][0]) {
        obj.bbox = this.getBounds(false);
    }


    if (extraAttrs) obj = _.extend(obj, extraAttrs);
    delete obj.value; // TODO this is intransparent, but see above: doc.set('value', null); // TODO: does not work
    return toGeoJSON(obj);
}
GeoFeatureSchema.methods.getBounds = function(overflow180) {
    return c2d.getBounds(this.geometry.coordinates, overflow180);
};
GeoFeatureSchema.methods.getCenter = function() {
    return c2d.getBounds(this.bbox);
};
GeoFeatureSchema.plugin(useTimestamps);
//GeoFeatureSchema.index({bbox: '2d', featureCollection: 1});
GeoFeatureSchema.index({'properties.val': 1});
GeoFeatureSchema.index({'properties.label': 1});
GeoFeatureSchema.pre('save', function (next) {
    this.bbox = this.getBounds(true);
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

    var options = _.cloneextend(options || {}),
        conditions = _.cloneextend(conditions || {}),
        bboxField = options.mapReduce ? 'value.bbox' : 'bbox';

    if (bbox) {
        conditions[bboxField] = {
            $within: {
                $box: c2d.getBounds(bbox)
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

//var GeoFeature = mongoose.model('GeoFeature', GeoFeatureSchema);

module.exports = {
    User: User, 
    Job: Job, 
    //Point: Point, 
    LayerOptions: LayerOptions, 
    //PointCollection: PointCollection, 
    Map: Map,
    GeoFeatureCollection: GeoFeatureCollection,
    adHocModel: adHocModel
    //GeoFeature: GeoFeature,
};
