var IS_BROWSER = this.Document && true;
var DEV = IS_BROWSER && window.location.href.indexOf(':3000') != -1;
var DEBUG = DEV;

var BASE_URL = 'http://' + (!DEV ? 'geosense.herokuapp.com' : 'localhost:3000');
var CLOUDMADE_KEY = '20ad85b3809a478d914850709a80b3a5';

var MapStatus = {
	PRIVATE: 'P',
	PUBLIC: 'A'
}

DataStatus = {
	IMPORTING: 'I',
	UNREDUCED: 'U',
	REDUCING: 'R',
	COMPLETE: 'C',
	UNREDUCED_INC: 'UI'
};

var FeatureType = {
	POINTS: 'P',
	CELLS: 'C',
	BUBBLES: 'B' 
};

FeatureType.DEFAULT = FeatureType.CELLS;

var MapLayerType = {
	POINTS: 'P',
	SHAPES: 'S'
};

var ColorType = {
	SOLID: 'S',
	LINEAR_GRADIENT: 'L'
}

ColorType.DEFAULT = ColorType.SOLID;

var UnitFormat = {
	LEGEND: '%(value)s'
}

var COLOR_GRADIENT_STEP = null; // 1 / 500.0;

var DEFAULT_FEATURE_OPACITY = .75,
	DEFAULT_SELECTED_FEATURE_OPACITY = DEFAULT_FEATURE_OPACITY + (1 - DEFAULT_FEATURE_OPACITY) / 2,
	MIN_BUBBLE_SIZE = 2,
	MAX_BUBBLE_SIZE = 60,
	DEFAULT_SELECTED_STROKE_COLOR = '#eee',
	DEFAULT_POINT_RADIUS = 7,
	DEFAULT_POINT_STROKE_WIDTH = 1,
	DEFAULT_SELECTED_STROKE_WIDTH = 2;

// the higher this ratio, the more cropping of extreme high values in histograms if
// cropDistribution == true
var CROP_DISTRIBUTION_RATIO = 1 / 10;

var DEFAULT_MAP_STYLE = 'dark';

var DEFAULT_MAP_AREA = {
	center: [0, 0],
	zoom: 0
};

if (!IS_BROWSER) {
	// Not browser: export settings for Node module
	module.exports = {
		MapStatus: MapStatus,
		FeatureType: FeatureType,
		ColorType: ColorType,
		MapLayerType: MapLayerType,
	};
} else {
	// Browser: define console.log if undefined
	if (!DEBUG || typeof console == "undefined" || typeof console.log == "undefined") var console = { log: function() {} }; 
}
