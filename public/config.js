/* Config 
*/

var DEBUG = true;
if (!DEBUG || typeof console == "undefined" || typeof console.log == "undefined") var console = { log: function() {} }; 

function getURLParameter(paramName) {
  var searchString = window.location.search.substring(1),
      i, val, params = searchString.split("&");

  for (i=0;i<params.length;i++) {
    val = params[i].split("=");
    if (val[0] == paramName) {
      return unescape(val[1]);
    }
  }
  return null;
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
var tilt = 0.41;

var IS_IPAD = navigator.userAgent.match(/iPad/i) != null;
var VIRTUAL_PHYSICAL_FACTOR = .9; 
var CAMERA_FOV = 54.25;
var SMOOTH_TWEEN_DURATION = 50;
var CAMERA;
var POLL_INTERVAL = 5000;
var COLOR_SOLID = 1;
var COLOR_RANGE = 2;

var lensTag = getURLParameter('lens_tag') || false;
var globeTag = getURLParameter('globe_tag') || false;

var IS_AR = lensTag != false;
var IS_TAGGED_GLOBE = globeTag != false;

var WORLD_ROT_X = Math.PI / 2;
var WORLD_ROT_Y = -Math.PI / 2;
var WORLD_ROT_Z = tilt;

var taggedObjects = [
	new TaggedObject('globe', [
		new ObjectTag((globeTag && globeTag != 1 ? globeTag : 'Right-Hand-3'), [0, 0, 0])
	]),
	new TaggedObject('lens', [
		new ObjectTag((lensTag && lensTag != 1 ? lensTag : 'Left-Hand-1'), [0, 0, 0]),
		//new ObjectTag('Object-03', [-150, 100, 0]),
		//new ObjectTag('Object-06', [150, -100, 0])
	])
];

console.log(taggedObjects);

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