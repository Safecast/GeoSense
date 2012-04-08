/* Config 
*/

//APP GLOBALS

var DEBUG = true;
var _firstLoad = true;
var _mapId = String;
var _mapName = String;
var _mapCollections = [];

var num_data_sources = 0;
var pointCollection = new Array();

var _defaultMapStyle = 'dark';
var defaultMapLocation = 'japan'
							
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