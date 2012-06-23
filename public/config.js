/* Config 
*/

var FeatureType = {
	POINTS: 'P',
	CELLS: 'C',
	BUBBLES: 'B' 
};

FeatureType.DEFAULT = FeatureType.CELLS;

var DataStatus = {
	IMPORTING: 'I',
	REDUCING: 'R',
	DONE: 'D'
};

var ColorType = {
	SOLID: 'S',
	LINEAR_GRADIENT: 'L'
}

var UnitFormat = {
	LEGEND: '%(value)s'
}

ColorType.DEFAULT = ColorType.SOLID;

var DEBUG = 1;
var DEG_PER_PX_AT_ZOOM_0 = 0.7111111112100985
var GRID_SIZES = {
//	'-1': 2,
	'0': DEG_PER_PX_AT_ZOOM_0 * 4
};
for (var zoom = 1; zoom <= 15; zoom++) {
	GRID_SIZES[zoom] = GRID_SIZES[zoom - 1] / 2;
}

if (!DEBUG || typeof console == "undefined" || typeof console.log == "undefined") var console = { log: function() {} }; 

var COLOR_GRADIENT_STEP = null; // 1 / 500.0;

var DEFAULT_FEATURE_OPACITY = .75;
var DEFAULT_SELECTED_FEATURE_OPACITY = DEFAULT_FEATURE_OPACITY + (1 - DEFAULT_FEATURE_OPACITY) / 2;

// the higher this ratio, the more cropping of extreme high values in histograms if
// cropDistribution == true
var CROP_DISTRIBUTION_RATIO = 1 / 10;

var _panelLoaded = false;
var _admin = true;
var _firstLoad = true;
var _setupRoute = false;
var _mapId = String;
var _mapAdminId = String;
var _mapName = String;
var _mapCollections = [];
var _commentArray = [];

var pointCollection = new Array();
var timeBasedPointCollection = new Array();


var _defaultMapStyle = 'dark';
var _defaultMapLocation = 'Fukushima';
var _defaultMapZoom = 6;

var _settingsVisible = false;
var _graphVisible = false;
var _dataLibraryVisible = false;
var _chatVisible = false;
							
