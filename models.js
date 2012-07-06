var mongoose = require('mongoose'),
	config = require('./config.js');
	mongooseTypes = require("mongoose-types");

mongooseTypes.loadTypes(mongoose);
useTimestamps = mongooseTypes.useTimestamps

this.User = mongoose.model('User', new mongoose.Schema({
	name: String,
	email: {type: mongoose.SchemaTypes.Email, required: true}	
}));

this.User.schema.plugin(useTimestamps);

this.Point = mongoose.model('Point', new mongoose.Schema({
	pointCollection: { type: mongoose.Schema.ObjectId, ref: 'PointCollection', required: true, index: 1 },
	loc: {type: [Number], index: '2d', required: true},
	val: {type: Number, index: 1},
	altVal: [mongoose.Schema.Types.Mixed],
	label: String,
	url: String,
	datetime: {type: Date, index: 1},
}));

this.Point.schema.plugin(useTimestamps);
this.Point.schema.index({loc: '2d', pointCollection: 1})

this.Shape = mongoose.model('Shape', new mongoose.Schema({
	pointCollection: { type: mongoose.Schema.ObjectId, ref: 'PointCollection', required: true, index: 1 },
	loc: {type: [Number], index: '2d', required: true},
	type: {type: String, required: true},
	geometry: {type: String, required: true},
	label: String,
	url: String,
	datetime: {type: Date, index: 1},
}));

this.Point.schema.plugin(useTimestamps);
this.Point.schema.index({loc: '2d', pointCollection: 1})

this.ColorDefinition = mongoose.model('ColorDefinition', new mongoose.Schema({
	color: {type: String, required: true},
	position: Number,
	absPosition: Number,
	interpolation: String,
	title: String,
	description: String
}));

// TODO: implement color palette storage -- erasing old palettes

this.ColorPalette = mongoose.model('ColorPalette', new mongoose.Schema({
	colors: {type: [this.ColorDefinition.schema]}
}));

this.LayerOptions = mongoose.model('LayerOptions', new mongoose.Schema({
	visible: Boolean,
	featureType: String,
	colorType: String,
	//colorPalettes: {type: [ColorPalette.schema], index: 1},
	colors: [{
		color: {type: String, required: true},
		position: Number,
		absPosition: Number,
		interpolation: String
	}],
	opacity: Number,
	datetimeFormat: String,
	valFormat: [{
		unit: {type: String, required: true},
		eq: {type: String, required: true},
		formatString: String
	}],
	/*altValFormat: [{
		unit: {type: String, required: true},
		eq: {type: String, required: true},
		formatString: String
	}],*/
}));

this.PointCollection = mongoose.model('PointCollection', new mongoose.Schema({
	title: String,
	description: String,
	source: String,
	unit: String,
	altUnit: [String],	
	maxVal: Number,
	minVal: Number,
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
}));

this.ShapeCollection.schema.plugin(useTimestamps);

this.MapLayer = mongoose.model('MapLayer', new mongoose.Schema({
	pointCollection: { type: mongoose.Schema.ObjectId, ref: 'PointCollection', index: 1 },
	shapeCollection: { type: mongoose.Schema.ObjectId, ref: 'ShapeCollection', index: 1 },
	options: { type: mongoose.Schema.ObjectId, ref: 'LayerOptions', index: 1 },
	status: {type: String, enum: [config.MapLayerType.POINTS, config.MapLayerType.SHAPES], required: true, default: config.MapLayerType.POINTS},
}));

this.Map = mongoose.model('Map', new mongoose.Schema({
	active: {type: Boolean, default: true},
	title: {type: String, required: true},
	description: String,
	author: String,
	url: String,
	twitter: String,
	displayInfo: Boolean,
	adminslug: {type: String, required: true, index: {unique: true}},
	publicslug: {type: String, required: true, index: {unique: true}},
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
}));

this.Map.schema.plugin(useTimestamps);

/*
Adjusts minVal, maxVal and color positions for all layers if there are if 
absPosition is defined for any color.

This allows us to have colors with relative (normalized) positions between
0 and 1, as well as colors with absolute positions, for which minVal and 
maxVal may have to be adjusted if the absolute position is lower or greater. 
*/
this.Map.prototype.adjustScales = function() {
	var map = this;
	for (var i = 0; i < map.layers.length; i++) {
		var colors = map.layers[i].options.colors;
		var pointCollection = map.layers[i].pointCollection;
		// adjust minVal and maxVal so that absPosition fits between them
		if (colors) {
			for (var j = 0; j < colors.length; j++) {
				if (colors[j].absPosition != null) {
					map.layers[i].pointCollection.minVal = Math.min(
						map.layers[i].pointCollection.minVal, colors[j].absPosition);
					map.layers[i].pointCollection.maxVal = Math.max(
						map.layers[i].pointCollection.maxVal, colors[j].absPosition);
				}
			}
			// for each color, calculate new position if absPosition is set
			for (var j = 0; j < colors.length; j++) {
				if (colors[j].absPosition != null) {
					console.log(colors[j].absPosition, pointCollection.minVal, pointCollection.maxVal);
					var p = (colors[j].absPosition - pointCollection.minVal) / (pointCollection.maxVal - pointCollection.minVal);
					//colors[j].position = Math.max(0, Math.min(p, 1)); // not necessary since minVal and maxVal are adjusted
					colors[j].position = p;
				}
			}
			// sort by position
			colors.sort(function(a, b) { return (a.position - b.position) });
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

