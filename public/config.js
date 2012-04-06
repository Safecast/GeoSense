/* Config 
*/

var DEBUG = true;
var IS_IPAD = navigator.userAgent.match(/iPad/i) != null;
var VIRTUAL_PHYSICAL_FACTOR = 100; // 1 unit in GL view is 1km. 1mm movement in physical space maps to....

var ObjectTag = function(tagName, relLoc, relRot) {
	this.tagName = tagName;
	this.rel = {
		loc: new THREE.Vector3(relLoc[0], relLoc[1], relLoc[2]),
		mult: []
	};
	if (relRot) {
		if (relRot[0] != 0) {
			this.rel.mult.push(new THREE.Matrix4().setRotationX(relRot[0]));
		}
		if (relRot[1] != 0) {
			this.rel.mult.push(new THREE.Matrix4().setRotationY(relRot[1]));
		}
		if (relRot[2] != 0) {
			this.rel.mult.push(new THREE.Matrix4().setRotationZ(relRot[2]));
		}
	}
	this.phys = {
		loc: null,
		norm: null,
		over: null
	};
	this.virt = {
		loc: null,
		norm: null,
		over: null
	};

	return this;
};

ObjectTag.prototype.update = function(protein) {
	var p = protein[this.tagName];
	if (p) {
		this.phys.loc = p.loc;
		this.phys.norm = p.norm;
		this.phys.over = p.over;

		var vLoc = new THREE.Vector3(p.loc[0], p.loc[1], p.loc[2]);
		var vNorm = new THREE.Vector3(p.norm[0], p.norm[1], p.norm[2]);
		var vOver = new THREE.Vector3(p.over[0], p.over[1], p.over[2]);

		// todo: add rel loc with correct orientation

		// todo: make this work 
		/*
		if (this.rel.mult.length) {
			for (var i = 0; i < this.rel.mult.length; i++) {
				vLoc = this.rel.mult[i].multiplyVector3(vLoc);
				vNorm = this.rel.mult[i].multiplyVector3(vNorm);
				vOver = this.rel.mult[i].multiplyVector3(vOver);
			}
		}
		*/

		this.virt.loc = vLoc.multiplyScalar(VIRTUAL_PHYSICAL_FACTOR);
		this.virt.norm = vNorm.multiplyScalar(VIRTUAL_PHYSICAL_FACTOR);
		this.virt.over = vOver.multiplyScalar(VIRTUAL_PHYSICAL_FACTOR);

		return true;
	}
	return false;
};

var OBJECT_TAGS = {
	globe: [
		new ObjectTag('Object-05', [0, 0, 0])
	],
	lens: [
		new ObjectTag('Object-06', [0, 0, 0]),
		new ObjectTag('Object-03', [0, 0, 0])
	]
};

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