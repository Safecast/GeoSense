var DEV = 1;
var DEBUG = DEV;

var BASE_URI = !DEV ? 'geo.media.mit.edu/' : 'localhost:3000/';
var BASE_URL = 'http://' + BASE_URI;

var MapStatus = {
	PRIVATE: 'P',
	PUBLIC: 'A'
}

var DataStatus = {
	IMPORTING: 'I',
	UNREDUCED: 'U',
	REDUCING: 'R',
	DONE: 'D'
};

var FeatureType = {
	POINTS: 'P',
	CELLS: 'C',
	BUBBLES: 'B' 
};

FeatureType.DEFAULT = FeatureType.CELLS;

var ColorType = {
	SOLID: 'S',
	LINEAR_GRADIENT: 'L'
}

ColorType.DEFAULT = ColorType.SOLID;

var UnitFormat = {
	LEGEND: '%(value)s'
}

var COLOR_GRADIENT_STEP = null; // 1 / 500.0;

var DEFAULT_FEATURE_OPACITY = .75;
var DEFAULT_SELECTED_FEATURE_OPACITY = DEFAULT_FEATURE_OPACITY + (1 - DEFAULT_FEATURE_OPACITY) / 2;

// the higher this ratio, the more cropping of extreme high values in histograms if
// cropDistribution == true
var CROP_DISTRIBUTION_RATIO = 1 / 10;

var DEFAULT_MAP_STYLE = 'dark';
var DEFAULT_MAP_LOCATION = 'Fukushima';
var DEFAULT_MAP_ZOOM = 6;

if (!this.Document) {
	// Not browser: export settings for Node module
	module.exports = {
		MapStatus: MapStatus,
		FeatureType: FeatureType,
		DataStatus: DataStatus,
		ColorType: ColorType,
	};
} else {
	// Browser: define console.log if undefined
	if (!DEBUG || typeof console == "undefined" || typeof console.log == "undefined") var console = { log: function() {} }; 
}
