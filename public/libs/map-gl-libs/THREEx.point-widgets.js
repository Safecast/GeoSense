/** @namespace */
var THREEx		= THREEx 		|| {};

THREEx.PointWidget = function(position, val, initObj)
{
	var barHeight = 3000;
	var barWidth = 200;
	var materials = [];

	for (var c = 0; c < 6; c ++ ) {
		materials.push( new THREE.MeshBasicMaterial( { color: initObj.color, transparent: true, blending: THREE.AdditiveBlending } ) );
		//materials.push( new THREE.MeshLambertMaterial( { color: color, shading: THREE.FlatShading } ) );
	}

	var barH = val * barHeight;
	var cube = new THREE.Mesh( new THREE.CubeGeometry(barWidth, barWidth, barH, 1, 1, 1, materials ), new THREE.MeshFaceMaterial() );
	cube.position = position;

	this.object3D = cube;

	return this;
};