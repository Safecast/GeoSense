/* Config 
*/

//APP GLOBALS

var DEBUG = true;
var IS_IPAD = navigator.userAgent.match(/iPad/i) != null;
var VIRTUAL_PHYSICAL_FACTOR = 100; // 1 unit in GL view is 1km. 1mm movement in physical space maps to....
var SMOOTH_TWEEN_DURATION = 50;

var taggedObjects = [
	new TaggedObject('globe', [
		new ObjectTag('Object-05', [0, 200, 0])
	]),
	new TaggedObject('lens', [
		new ObjectTag('Left-Hand-1', [-150, 100, 0]),
		//new ObjectTag('Object-03', [-150, 100, 0]),
		//new ObjectTag('Object-06', [150, -100, 0])
	])
];

var _firstLoad = true;
var _setupRoute = false;
var _mapId = String;
var _mapName = String;
var _mapCollections = [];
var _commentArray = [];

var _num_data_sources = 0;
var _loaded_data_sources = 0;
var pointCollection = new Array();

var _defaultMapStyle = 'dark';
var _defaultMapLocation = 'Japan';

var _settingsVisible = false;
var _dataLibraryVisible = false;
var _chatVisible = false;
							
//VARIABLES FOR THREE.JS
							
var radius = 6371,
tilt = 0.41,
rotationSpeed = 0.1,
cloudsScale = 1.005,
moonScale = 0.23,
height = window.innerHeight,
width  = window.innerWidth,
container, stats,
camera, controls, scene, renderer,
geometry, meshPlanet, meshClouds, meshMoon,
dirLight, ambientLight,
clock = new THREE.Clock();