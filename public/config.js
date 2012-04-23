/* Config 
*/

var DEBUG = true;
if (!DEBUG || typeof console == "undefined" || typeof console.log == "undefined") var console = { log: function() {} }; 

function getURLParameter(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
    );
}

function genQueryString(params, name) {
	var url = '';
	if (params instanceof Array) {
		for (var i = 0; i < params.length; i++) {
			url += (url != '' ? '&' : '') + name + '=' + params[i];
		}
	} else {
		for (var name in params) {
			if (params[name] instanceof Array) {
				url += (url != '' ? '&' : '') + genQueryString(params[name], name);
			} else {
				url += (url != '' ? '&' : '') + name + '=' + params[name];
			}
		}
	}
	return url;
}

//APP GLOBALS

var IS_IPAD = navigator.userAgent.match(/iPad/i) != null;
var IS_AR = getURLParameter('lens') == true;
var VIRTUAL_PHYSICAL_FACTOR = 1.2; 
var CAMERA_FOV = 54.25;
var SMOOTH_TWEEN_DURATION = 50;
var CAMERA;
var POLL_INTERVAL = 5000;
var COLOR_SOLID = 1;
var COLOR_RANGE = 2;


var taggedObjects = [
	new TaggedObject('globe', [
		new ObjectTag((getURLParameter('globe') || 'Right-Hand-3'), [0, 0, 0])
	]),
	new TaggedObject('lens', [
		new ObjectTag('Left-Hand-1', [-6, -15, 35]),
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
var _boundCollections = {};
var _commentArray = [];

var _num_data_sources = 0;
var _loaded_data_sources = 0;
var pointCollection = new Array();
var timeBasedPointCollection = new Array();


var _defaultMapStyle = 'dark';
var _defaultMapLocation = 'Japan';

var _settingsVisible = false;
var _graphVisible = false;
var _dataLibraryVisible = false;
var _chatVisible = false;
							
//VARIABLES FOR THREE.JS
							
var radius = 190, //6371,
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