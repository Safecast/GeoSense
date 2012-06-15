/* Config 
*/

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

//APP GLOBALS
var tilt = 0.41;

var IS_IPAD = navigator.userAgent.match(/iPad/i) != null;
var VIRTUAL_PHYSICAL_FACTOR = 1; 
var CAMERA_FOV = 50;
var SMOOTH_TWEEN_DURATION = 50;
var CAMERA;
var INITIAL_POLL_INTERVAL = 3000;
var POLL_INTERVAL = 6000;

var lensTag = getURLParameter('lens_tag') || false;
var globeTag = getURLParameter('globe_tag') || false;

//var IS_AR = IS_IPAD || lensTag != false;
var IS_TAGGED_GLOBE = globeTag != false;

var IS_LOUPE = getURLParameter('loupe') || false;
var IS_AR = (!IS_LOUPE ? (!IS_IPAD && !getURLParameter('ar') ? false : lensTag != false) : false);
var IS_GESTURAL = getURLParameter('gestural') || false;

var IS_TOP_DOWN = getURLParameter('top_down') || false;

var radius = 145; //6371


var LOUPE_FOCAL_DISTANCE = radius * 2.5;
var LOUPE_STRENGTH = CAMERA_FOV * .95;

var WORLD_ROT_X = Math.PI / 2;
var WORLD_ROT_Y = -Math.PI / 2;
var WORLD_ROT_Z = tilt;
var WORLD_FIXED_DIST = !IS_TOP_DOWN ? radius * 3 : 640;

if (IS_AR || IS_TOP_DOWN || IS_TAGGED_GLOBE) {
	WORLD_ROT_Z = 0;
}

var taggedObjects = [
	new TaggedObject('globe', [
		new ObjectTag((globeTag && globeTag != 1 ? globeTag : 'Left-Hand-3'), [0, 0, 0])
	]),
	new TaggedObject('lens', [
		new ObjectTag((lensTag && lensTag != 1 ? lensTag : 'Left-Hand-1'), [0, 0, 0]),
		//new ObjectTag('Object-03', [-150, 100, 0]),
		//new ObjectTag('Object-06', [150, -100, 0])
	])
];

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
var _defaultMapLocation = 'Japan';

var _settingsVisible = false;
var _graphVisible = false;
var _dataLibraryVisible = false;
var _chatVisible = false;
							
//VARIABLES FOR THREE.JS
							
var rotationSpeed = 0.1,
cloudsScale = 1.005,
moonScale = 0.23,
height = window.innerHeight,
width  = window.innerWidth,
container, stats,
camera, controls, scene, renderer,
geometry, meshPlanet, meshClouds, meshMoon,
dirLight, ambientLight,
clock = new THREE.Clock();