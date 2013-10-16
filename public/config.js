var IS_BROWSER = this.Document && true;

if (IS_BROWSER) {
	define([], function() {
		var conf = {
			MAP_VIEW_MODULES: ['views/maps/openlayers-map-view']
		};
		return conf;
	});
}

var DEV = IS_BROWSER && window.location.href.indexOf(':3000') != -1;
var DEBUG = DEV;

var CLOUDMADE_KEY = '0a77f5f7d290465f9fe419f4ee788c50';

var MapStatus = {
	PRIVATE: 'P',
	PUBLIC: 'A'
}

var SHOW_DETAIL_DATA_ON_MAP = true;

var DEFAULT_COLOR_EDITOR_COLOR = '#999999',
	DEFAULT_COLOR_EDITOR_POSITION = '100%',
	COLOR_BAR_INVERT_CUTOFF = 0x66;

var DataStatus = {
	IMPORTING: 'I',
	IMPORTING_INC: 'II',
	UNREDUCED: 'U',
	UNREDUCED_INC: 'UI',
	REDUCING: 'R',
	REDUCING_INC: 'RI',
	COMPLETE: 'C'
};

var FeatureType = {
	POINTS: 'P',
	SQUARE_TILES: 'ST',
	BUBBLES: 'B',
	SHAPES: 'S' 
};

FeatureType.DEFAULT = FeatureType.POINTS;

var LayerType = {
	POINTS: 'PL',
	SHAPES: 'SL'
};

var ColorType = {
	SOLID: 'S',
	LINEAR_GRADIENT: 'L',
	PALETTE: 'P'
}

ColorType.DEFAULT = ColorType.SOLID;

var UnitFormat = {
	LEGEND: '%(value)s'
}

var SharingType = {
	PRIVATE: 'P',
	WORLD: 'W'
};

SharingType.DEFAULT = SharingType.PRIVATE;

var COLOR_GRADIENT_STEP = null; // 1 / 500.0;

var highlightForColor = function(color) {
	return multRGB(color, 1.15);
};

var strokeForColor = function(color) {
	return multRGB(color, .75);
};

var DEFAULT_FEATURE_OPACITY = .75,
	MIN_BUBBLE_SIZE = 8,
	MAX_BUBBLE_SIZE = 60,
	DEFAULT_POINT_RADIUS = 7,
	DEFAULT_FEATURE_STROKE_WIDTH = 1;

// the higher this ratio, the more cropping of extreme high values in histograms if
// cropDistribution == true
var CROP_DISTRIBUTION_RATIO = 1 / 10;

var DEFAULT_MAP_VIEW_BASE = 'gm';
var DEFAULT_MAP_STYLE = 'dark';

var DEFAULT_MAP_AREA = {
	center: [0, 0],
	zoom: 0
};

var MAP_NUM_ZOOM_LEVELS = 20;

var INITIAL_POLL_INTERVAL = 3000;
var POLL_INTERVAL = 6000;

if (!IS_BROWSER) {
	// Not browser: export settings for Node module
	module.exports = {
		MapStatus: MapStatus,
		FeatureType: FeatureType,
		ColorType: ColorType,
		SharingType: SharingType
	};
} else {
	// Browser: define console.log if undefined
	if (!DEBUG || typeof console == "undefined" || typeof console.log == "undefined") var console = { log: function() {}, error: function() {} }; 
}

