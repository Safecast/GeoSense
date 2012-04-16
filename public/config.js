/* Config 
*/

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
var _mapId = String;
var _mapName = String;

var num_data_sources = 0;
var pointCollection = new Array();

var defaultMapStyle = 'light';
var defaultMapLocation = 'japan'

//VARIABLES FOR GOOGLE FUSION TABLES
var map_zoom = 8;
var mobileVisible = true;

var zoom_key = 0; 
var layers = new Object(); layers['squares'] = null; layers['dots'] = null;
var listeners = new Array("squares", "dots");

var tbl_title = new Array(
				"Last_updated","grid", "lat_lon",
				"100km", "100km", "100km", "100km", "100km",
				"50km", "50km",
				"10km", "10km",
				"5km", "5km",
				"1km", "1km",
				"500m", "500m", "500m", "500m", "500m", "500m", "500m", "500m");
				
var tbl_data = new Array(
				"2012-01-23", "grid", "lat_lon",
				"2172062", "2172062", "2172062", "2172062", "2172062",	// 0..4
				"2168823", "2168823",	//  5..6
				"2168931", "2168931",	//  7..8
				"2172158", "2172158",	//  9..10
				"2168932", "2168932",	// 11..12
				"2084852", "2084852", "2084852", "2084852", "2084852", "2084852", "2084852", "2084852"); // 13..20
							
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