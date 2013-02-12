var mongoose = require('mongoose'),
    config = require('./config.js');
    mongooseTypes = require("mongoose-types");

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

this.User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: {type: mongoose.SchemaTypes.Email, required: true}   
}));

this.User.schema.plugin(useTimestamps);

this.Job = mongoose.model('Job', new mongoose.Schema({
    createdAt: Date,
    updatedAt: Date,
    type: {type: String, enum: [config.JobType.IMPORT, config.JobType.REDUCE], required: true},
    status: {type: String, enum: [config.JobStatus.ACTIVE, config.JobStatus.IDLE], required: true, default: config.MapLayerType.POINTS},
}));

this.Job.schema.plugin(useTimestamps);

this.Point = mongoose.model('Point', new mongoose.Schema({
    pointCollection: { type: mongoose.Schema.ObjectId, ref: 'PointCollection', required: true, index: 1 },
    importJob: { type: mongoose.Schema.ObjectId, ref: 'Job', required: false, index: 1 },
    loc: {type: [Number], index: '2d', required: true},
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

this.Point.schema.plugin(useTimestamps);
this.Point.schema.index({loc: '2d', pointCollection: 1})

this.Shape = mongoose.model('Shape', new mongoose.Schema({
    shapeCollection: { type: mongoose.Schema.ObjectId, ref: 'ShapeCollection', required: true, index: 1 },
    type: {type: String, required: true},
    geometry: mongoose.Schema.Types.Mixed,
    properties: mongoose.Schema.Types.Mixed
}));

this.Shape.schema.plugin(useTimestamps);
this.Shape.schema.index({ws: '2d', en: '2d', shapeCollection: 1})

this.ColorDefinition = mongoose.model('ColorDefinition', new mongoose.Schema({
    color: {type: String, required: true},
    position: Number,
    interpolation: String,
    title: String,
    description: String
}));

// TODO: implement color palette storage -- erasing old palettes

this.ColorPalette = mongoose.model('ColorPalette', new mongoose.Schema({
    colors: {type: [this.ColorDefinition.schema]}
}));

this.LayerOptions = mongoose.model('LayerOptions', new mongoose.Schema({
    visible: {type: Boolean, required: true},
    featureType: {type: String, required: true},
    colorType: {type: String, required: true, default: config.ColorType.LINEAR_GRADIENT},
    //colorPalettes: {type: [ColorPalette.schema], index: 1},
    colors: [{
        color: {type: String, required: true},
        position: String,
        interpolation: {type: String, enum: ['linear', 'threshold']},
        label: String
    }],
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
    description: String,
    histogram: {type: mongoose.Schema.Types.Mixed, default: true},
    itemTitle: String,
    itemTitlePlural: String

    /*altValFormat: [{
        unit: {type: String, required: true},
        eq: {type: String, required: true},
        formatString: String
    }],*/
}));

this.LayerOptions.schema.path('colors').validate(function (value) {
    return value.length > 0;
}, 'At least one color is required');

this.PointCollection = mongoose.model('PointCollection', new mongoose.Schema({
    title: String,
    description: String,
    source: String,
    unit: String,
    altUnit: [String],  
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

this.PointCollection.schema.plugin(useTimestamps);

this.ShapeCollection = mongoose.model('ShapeCollection', new mongoose.Schema({
    title: String,
    description: String,
    source: String,
    timeBased: Boolean,
    defaults: { type: mongoose.Schema.ObjectId, ref: 'LayerOptions', index: 1 },
    active: Boolean,
    status: String,
    progress: Number,
    numBusy: Number,
    reduce: Boolean,
    cropDistribution: Boolean,
    createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', index: 1 },
    modifiedBy: { type: mongoose.Schema.ObjectId, ref: 'User', index: 1 },
    createdAt: Date,
    updatedAt: Date,
}));

this.ShapeCollection.schema.plugin(useTimestamps);

this.MapLayer = mongoose.model('MapLayer', new mongoose.Schema({
    _id: { type: mongoose.Schema.ObjectId },
    pointCollection: { type: mongoose.Schema.ObjectId, ref: 'PointCollection', index: 1 },
    shapeCollection: { type: mongoose.Schema.ObjectId, ref: 'ShapeCollection', index: 1 },
    options: { type: mongoose.Schema.ObjectId, ref: 'LayerOptions', index: 1 },
    type: {type: String, enum: [config.MapLayerType.POINTS, config.MapLayerType.SHAPES], required: true, default: config.MapLayerType.POINTS},
}));

this.Map = mongoose.model('Map', new mongoose.Schema({
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
    layers: {type: [this.MapLayer.schema], index: 1},
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

this.Map.schema.plugin(useTimestamps);

/*
Adjusts minVal, maxVal and color positions for all layers if 
isAbsolute is true for any color.

This allows us to have colors with relative (normalized) positions between
0 and 1, as well as colors with absolute positions, for which minVal and 
maxVal may have to be adjusted if the absolute position is lower or greater. 
*/
this.Map.prototype.adjustScales = function() {
    var map = this;
    for (var i = 0; i < map.layers.length; i++) {
        var colors = map.layers[i].options.colors;
        var pointCollection = map.layers[i].pointCollection;
        // adjust minVal and maxVal so that abs position fits between them
        if (colors) {
            for (var j = 0; j < colors.length; j++) {
                if (colors[j][colors[j].length - 1] != '%') {
                    map.layers[i].pointCollection.minVal = Math.min(
                        map.layers[i].pointCollection.minVal, parseFloat(colors[j].position));
                    map.layers[i].pointCollection.maxVal = Math.max(
                        map.layers[i].pointCollection.maxVal, parseFloat(colors[j].position));
                }
            }
            // for each color, calculate new position if isAbsolute
/*            for (var j = 0; j < colors.length; j++) {
                if (colors[j][colors[j].length - 1] != '%') {
                    var p = (parseFloat(colors[j].position) - pointCollection.minVal) / (pointCollection.maxVal - pointCollection.minVal);
                    //colors[j].position = Math.max(0, Math.min(p, 1)); // not necessary since minVal and maxVal are adjusted
                    colors[j].position = p;
                } else {
                    colors[j].position = parseFloat(colors[j].position);
                }
            }
            // sort by position
            colors.sort(function(a, b) { return (a.position - b.position) });
            */
        }
    }
}

this.Tweet = mongoose.model('Tweet', new mongoose.Schema({
    pointCollection: { type: mongoose.Schema.ObjectId, ref: 'PointCollection', required: true, index: 1 },
    mapid: String,
}));

this.TweetCollection = mongoose.model('TweetCollection', new mongoose.Schema({
    pointCollection: { type: mongoose.Schema.ObjectId, ref: 'PointCollection', required: true, index: 1 },
    mapid: String,
    name: String,
}));

this.Chat = mongoose.model('Chat', new mongoose.Schema({
    map: { type: mongoose.Schema.ObjectId, ref: 'Map', required: true, index: 1 },
    name: String,
    text: String,
    date: Date,
}));

this.Comment = mongoose.model('Comment', new mongoose.Schema({
    map: { type: mongoose.Schema.ObjectId, ref: 'Map', required: true, index: 1 },
    name: String,
    text: String,
    date: Date,
}));


/*

this.Feature = mongoose.model('Feature', new mongoose.Schema({
    FeatureCollection: { type: mongoose.Schema.ObjectId, ref: 'FeatureCollection', required: true, index: 1 },
    bbox: {type: Array, index: '2d'},
    geometry: {
        type: {type: String, enum: ['Point', 'Polygon']},
        coordinates: {type: Array, index: '2d'},
        properties: mongoose.Schema.Types.Mixed
    }
}));

// problem: can only index one- [] or two-dimensional [[]] arrays.

> db.features.ensureIndex({"geometry.coordinate": "2d"})
> db.features.save({geometry: {type: "Point", coordinate: [[1,1], [1,1]]}})
> db.features.save({geometry: {type: "Point", coordinate: [[[1,1], [1,1]]]}})
geo values have to be numbers: { 0: [ 1.0, 1.0 ], 1: [ 1.0, 1.0 ] }


/*


FeatureCollection,
  "features": []


*/



