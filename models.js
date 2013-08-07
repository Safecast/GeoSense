var config = require('./config'),
    geogoose = require('./geogoose'),
    console = require('./ext-console'),
    mongoose = require('mongoose'),
    mongooseTypes = require("mongoose-types"),
    _ = require('cloneextend'),
    util = require('util');

var useTimestamps = function (schema, options) {
    schema.add({
        createdAt: {type: Date, index: 1},
        updatedAt: {type: Date, index: 1}
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
    status: {type: String, enum: [config.JobStatus.ACTIVE, config.JobStatus.IDLE], required: true},
}));

Job.schema.plugin(useTimestamps);


var colorMatch = /^#([a-fA-F0-9]{2}){3}$/;

var LayerOptions = mongoose.model('LayerOptions', new mongoose.Schema({
    htmlRenderer: {type: String, required: false, default: "", enum: ["", "Canvas", "SVG"]},
    enabled: {type: Boolean, required: true, default: true},
    public: {type: Boolean, required: true, default: true},
    featureType: {type: String, required: true, enum: [
        config.FeatureType.POINTS, config.FeatureType.SQUARE_TILES, config.FeatureType.BUBBLES, config.FeatureType.SHAPES]},
    featureTypeFallback: {type: Boolean, default: true},
    colorType: {type: String, required: true, default: config.ColorType.LINEAR_GRADIENT},
    //colorPalettes: {type: [ColorPalette.schema], index: 1},
    colorSchemes: [{
        name: {type: String, required: true},
        colors: [{
            color: {type: String, required: true, match: colorMatch},
            position: {type: String, match: /^[0-9]+(\.[0-9]+)?%?$/},
            interpolation: {type: String, enum: ['lerpRGB', 'threshold', ''], required: false},
            label: String,
            description: String
    }]}],
    colorSchemeIndex: {type: Number, required: true, default: 0},
    colorLabelColor: {type: String, match: colorMatch},
    strokeColor: {type: String, match: colorMatch},
    reduction: String,
    opacity: {type: Number, required: true, min: 0, max: 1},
    strokeOpacity: {type: Number, min: 0, max: 1},
    strokeWidth: {type: Number, min: config.MIN_STROKE_WIDTH, max: config.MAX_STROKE_WIDTH},
    strokeDashstyle: {type: String},
    strokeLinecap: {type: String},
    attrMap: {
        featureSize: {type: String, enum: ['', '$numeric.avg', '$numeric.max', '$numeric.min', 'count']},
        featureColor: {type: String},
        numeric: {type: String},
        datetime: {type: String},
        label: {type: String},
    },
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
    cropDistribution: Boolean,
    feed: {
        url: String, // e.g. http://search.twitter.com/search.json?q=%(query)s&rpp=100&geocode=%(centerY)s,%(centerX)s,%(radius)s
        refreshInterval: Number,
        parser: String
    }
}));

LayerOptions.schema.path('colorSchemes').validate(function (value) {
    return value.length > 0 && value[0].colors && value[0].colors.length > 0;
}, 'At least one color scheme is required.');


var MapLayerSchema = new mongoose.Schema({
    featureCollection: { type: mongoose.Schema.ObjectId, ref: 'GeoFeatureCollection', index: 1 },
    layerOptions: { type: mongoose.Schema.ObjectId, ref: 'LayerOptions', index: 1 },
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
        viewStyle: String,
        baselayerOpacity: Number
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


var GeoFeatureSchema = new geogoose.models.GeoFeatureSchema({
    geocoded: {type: Boolean, default: false, required: true},
    incrementor: mongoose.Schema.Types.Mixed,
    source: mongoose.Schema.Types.Mixed,
    count: Number   
});

GeoFeatureSchema.plugin(useTimestamps);

GeoFeatureSchema.pre('save', function(next) {
    this.geocoded = this.bounds2d && this.bounds2d.length;
    if (this.geocoded && !this.geometry.type) {
        this.geometry.type = 'Point';
    }
    next();
});


var GeoFeatureMapReducedSchema = new geogoose.models.GeoFeatureSchema({_id: String}, null, null, null, {
    value: geogoose.models.geoJSONFeatureDefinition
});

GeoFeatureMapReducedSchema.methods.toGeoJSON = function(extraAttrs)
{
    var obj = this.toJSON().value;
    obj._id = this.get('_id').toString();
    if (extraAttrs) obj = _.extend(obj, extraAttrs);
    return geogoose.util.toGeoJSON(obj);
};


var GeoFeatureCollectionSchema = new geogoose.models.GeoFeatureCollectionSchema({
    title: String,
    description: String,
    source: String,
    unit: String,
    sourceFieldNames: {type: Array, default: []},
    fields: {type: Array},
    extremes: { type: mongoose.Schema.Types.Mixed, index: 1, default: {} },
    importParams: mongoose.Schema.Types.Mixed,
    gridSize: Number,
    defaults: { type: mongoose.Schema.ObjectId, ref: 'LayerOptions', index: 1 },
    active: Boolean,
    status: String,
    progress: Number,
    numBusy: Number,
    tile: String,
    limitFeatures: {type: Boolean},
    maxReduceZoom: Number,
    sync: Boolean,
    cropDistribution: Boolean,
    createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', index: 1 },
    modifiedBy: { type: mongoose.Schema.ObjectId, ref: 'User', index: 1 },
    createdAt: Date,
    updatedAt: Date,
    lastReducedAt: Date,
}, {FeatureSchema: GeoFeatureSchema});

GeoFeatureCollectionSchema.plugin(useTimestamps);

GeoFeatureCollectionSchema.methods.getMapReducedFeatureModel = function(opts) {
    var collectionName = 
        'r_'
        + this.getFeatureModel().collection.name
        + (opts.tileSize != undefined ? '_tile_rect_' + opts.tileSize : '')
        + (opts.timeGrid != undefined ? '_' + opts.timeGrid : '');
    return this.getFeatureModel({collectionName: collectionName, schema: GeoFeatureMapReducedSchema});
};

cloneLayerOptionsDefaults = function(featureCollection, callback)
{
    if (!featureCollection || !featureCollection.defaults) {
        console.warn('featureCollection has no defaults, creating from LAYER_OPTIONS_DEFAULTS')
        return new LayerOptions(config.LAYER_OPTIONS_DEFAULTS).save(callback);
    }
    LayerOptions.findById(featureCollection.defaults, function(err, defaults) {
        console.log('cloning featureCollection.defaults', defaults._id);
        if (err) {
            callback(err);
            return;
        }
        clone = defaults.toObject();
        delete clone._id;
        return new LayerOptions(clone).save(callback);
    });
};


var GeoFeatureCollection = mongoose.model('GeoFeatureCollection', GeoFeatureCollectionSchema);


module.exports = {
    User: User, 
    Job: Job, 
    LayerOptions: LayerOptions, 
    Map: Map,
    GeoFeatureCollection: GeoFeatureCollection,
    adHocModel: geogoose.util.adHocModel,
    cloneLayerOptionsDefaults: cloneLayerOptionsDefaults
};

