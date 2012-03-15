window.MapGLView = Backbone.View.extend({

    tagName: 'div',
	className: 'map-gl-view',
	
    events: {
    },

    widgets: [],
    world: null,


	degToRad: function(x) {
 		return x*Math.PI/180;
	},

	radToDeg: function(x) {
		return x*180/Math.PI;
	},

	latLngRotationMatrix: new THREE.Matrix4(),

	convertSphericalToCartesian: function(lat, lon, radiusOffset) {    
		var r = radius;
		if (radiusOffset) {
			r += radiusOffset;
		}
		var rLat = this.degToRad(lat);
		var rLon = this.degToRad(lon);
		
		var x = r * Math.cos(rLat)*Math.cos(rLon);    
		var y = r * Math.cos(rLat)*Math.sin(rLon);
		var z = r * Math.sin(rLat);
		var vec = new THREE.Vector3(x, y, z);

		console.log(lat+','+lon+' ==> '+x+','+y+','+z);

		return this.latLngRotationMatrix.multiplyVector3(vec);
	},

	convertCartesianToSpherical: function(v) {    
		var r = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);     
		var lat = this.radToDeg(Math.asin(v.z / r));    
		var lon = this.radToDeg(Math.atan2(v.y, v.x));    
		return [lat, lon];
	},

    initialize: function(options) {
	    this.template = _.template(tpl.get('map-gl'));
		this.animate();

		this.latLngRotationMatrix.setRotationAxis(new THREE.Vector3(1, 0, 0), -Math.PI/2);
		this.collections = {};
    },

	addCollection: function(id, collection)
	{	
		this.collections[id] = collection;
		this.collections[id].bind('reset', this.reset, this);
		this.collections[id].bind('add', this.addOne, this);
		this.collections[id].fetch();
	},

	createPointWidget: function(lat, lng, val, initObj)
	{
		var barHeight = 3000;
		var barWidth = 200;
		var barRadiusOffset = 0;
		var materials = [];

		for (var c = 0; c < 6; c ++ ) {
			materials.push( new THREE.MeshBasicMaterial( { color: initObj.color, transparent: true, blending: THREE.AdditiveBlending } ) );
			//materials.push( new THREE.MeshLambertMaterial( { color: color, shading: THREE.FlatShading } ) );
		}

		var barH = val * barHeight;
		var cube = new THREE.Mesh( new THREE.CubeGeometry(barWidth, barWidth, barH, 1, 1, 1, materials ), new THREE.MeshFaceMaterial() );
		cube.position = this.convertSphericalToCartesian(lat, lng, barRadiusOffset + barH / 2);
		cube.lookAt(meshPlanet.position);
	
		return cube;
	},

	addPointWidget: function(widget) 
	{
		this.world.add(widget);   
		this.widgets.push(widget);
	},
	
	reset: function(model) {
		var self = this;
		this.collections[model.collectionId].each(function (model) {
			self.addOne(model);
		});
	},
	
	animate: function() {
		var self = this;
		var loopTimer = 16;
		animationLoop = setInterval(function() {
			self.renderLoop();
		}, loopTimer);
	},

	renderLoop: function() {
		
		var delta = clock.getDelta();

		//meshPlanet.rotation.y += rotationSpeed * delta;
		this.world.rotation.y += rotationSpeed * delta;
		meshClouds.rotation.y += 1.25 * rotationSpeed * delta;

		var angle = delta * rotationSpeed;

		controls.update();

		renderer.clear();
		renderer.render( scene, camera );
	},

    render: function() {
		$(this.el).html(this.template());
		
		container = this.el;
		scene = new THREE.Scene();

		renderer = new THREE.WebGLRenderer( { clearAlpha: 1, clearColor: 0x111111, antialias: true } );
		renderer.setSize( width, height );
		renderer.sortObjects = false;
		renderer.autoClear = false;

		//

		renderer.gammaInput = true;
		renderer.gammaOutput = true;


		//

		container.appendChild( renderer.domElement );

		this.world = new THREE.Object3D();
		scene.add(this.world);

		camera = new THREE.PerspectiveCamera( 25, window.innerWidth / window.innerHeight, 50, 1e7 );
		camera.position.z = radius * 6;
		scene.add( camera );

		controls = new THREE.TrackballControls( camera, renderer.domElement );

		controls.rotateSpeed = 1.0;
		controls.zoomSpeed = 1.2;
		controls.panSpeed = 0.2;

		controls.noZoom = false;
		controls.noPan = false;

		controls.staticMoving = false;
		controls.dynamicDampingFactor = 0.3;

		controls.minDistance = radius * 1.1;
		controls.maxDistance = radius * 100;

		controls.keys = [ 65, 83, 68 ]; // [ rotateKey, zoomKey, panKey ]

		dirLight = new THREE.DirectionalLight( 0xdddddd );
		dirLight.position.set( -1, 0, 1 ).normalize();
		scene.add( dirLight );

		var planetTexture = THREE.ImageUtils.loadTexture( "assets/textures/planets/earth_white_debug.jpg" ),
		cloudsTexture     = THREE.ImageUtils.loadTexture( "assets/textures/planets/earth_clouds_1024.png" ),
		normalTexture     = THREE.ImageUtils.loadTexture( "assets/textures/planets/earth_normal_2048.jpg" ),
		specularTexture   = THREE.ImageUtils.loadTexture( "assets/textures/planets/earth_specular_2048.jpg" );

		var shader = THREE.ShaderUtils.lib[ "normal" ],
		uniforms = THREE.UniformsUtils.clone( shader.uniforms );

		uniforms[ "tNormal" ].texture = normalTexture;
		uniforms[ "uNormalScale" ].value = 0.85;

		uniforms[ "tDiffuse" ].texture = planetTexture;
		uniforms[ "tSpecular" ].texture = specularTexture;

		uniforms[ "enableAO" ].value = false;
		uniforms[ "enableDiffuse" ].value = true;
		uniforms[ "enableSpecular" ].value = true;

		uniforms[ "uDiffuseColor" ].value.setHex( 0xffffff );
		uniforms[ "uSpecularColor" ].value.setHex( 0x666666 );
		uniforms[ "uAmbientColor" ].value.setHex( 0x333333 );

		uniforms[ "uShininess" ].value = 20;

		uniforms[ "uDiffuseColor" ].value.convertGammaToLinear();
		uniforms[ "uSpecularColor" ].value.convertGammaToLinear();
		uniforms[ "uAmbientColor" ].value.convertGammaToLinear();

		var materialNormalMap = new THREE.ShaderMaterial({
			fragmentShader: shader.fragmentShader,
			vertexShader: shader.vertexShader,
			uniforms: uniforms,
			lights: true
		});

		// planet

		geometry = new THREE.SphereGeometry( radius, 100, 50 );
		geometry.computeTangents();

		meshPlanet = new THREE.Mesh( geometry, materialNormalMap );
		//meshPlanet.rotation.y = 0;
		this.world.rotation.z = tilt;
		this.world.add( meshPlanet );

		// clouds

		var materialClouds = new THREE.MeshLambertMaterial( { color: 0xffffff, ambient: 0x030303, map: cloudsTexture, transparent:true } );

		meshClouds = new THREE.Mesh( geometry, materialClouds );
		meshClouds.scale.set( cloudsScale, cloudsScale, cloudsScale );
		//meshClouds.rotation.z = tilt;
		this.world.add( meshClouds );

		// stars

		var i,
		vector,
		starsGeometry = new THREE.Geometry();

		for ( i = 0; i < 1500; i ++ ) {

			vector = new THREE.Vector3( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 );
			vector.multiplyScalar( radius );

			starsGeometry.vertices.push( new THREE.Vertex( vector ) );

		}

		/*var stars,
		starsMaterials = [
			new THREE.ParticleBasicMaterial( { color: 0xcccccc, size: 2, sizeAttenuation: false } ),
			new THREE.ParticleBasicMaterial( { color: 0xcccccc, size: 1, sizeAttenuation: false } ),
			new THREE.ParticleBasicMaterial( { color: 0xcccccc, size: 2, sizeAttenuation: false } ),
			new THREE.ParticleBasicMaterial( { color: 0xcccccc, size: 1, sizeAttenuation: false } ),
			new THREE.ParticleBasicMaterial( { color: 0xcccccc, size: 2, sizeAttenuation: false } ),
			new THREE.ParticleBasicMaterial( { color: 0xcccccc, size: 1, sizeAttenuation: false } )
		];

		for ( i = 10; i < 30; i ++ ) {

			stars = new THREE.ParticleSystem( starsGeometry, starsMaterials[ i % 6 ] );

			stars.rotation.x = Math.random() * 6;
			stars.rotation.y = Math.random() * 6;
			stars.rotation.z = Math.random() * 6;

			var s = i * 10;
			stars.scale.set( s, s, s );

			stars.matrixAutoUpdate = false;
			stars.updateMatrix();

			scene.add( stars );

		}*/


		// quick bar chart test

		var dataPoints = [
			[0, 0, 1],
			//[45, 0, 1],
			[0, 45, 1],
			[-45, -45, 1],
			[0, -90, 1],
			[45, -90, 1],

			[-34.578952,-58.40332, 1],
			[-12.21118,49.746094, 1],
			[38.272689,15.556641, 1],
			[-41.508577,174.287109, 1],
			[25,45, 1],

			//[-25, 45, 2],
			//[25, -90, 3],
			//[-25, -90, 4],
		];

		var colors = [
			0xff0000,
			0x00ff00,
			0x0000ff,
			0xffff00,
			0x00ffff,
		];

		/*
		for (var i = 0; i < dataPoints.length; i++) {

			this.addPointWidget(this.createPointWidget(
				dataPoints[i][0], dataPoints[i][1], dataPoints[i][2], {
					color: colors[i % colors.length]
				}));

		}
		*/



		/*var light = new THREE.DirectionalLight( 0xffffff );
		light.position.set( 0, radius * 2, radius * 2 );
		scene.add( light );*/

		scene.add(new THREE.AmbientLight( 0xffffff ));
				

		THREEx.WindowResize(renderer, camera);


        return this;
    },


	start: function() {
	
	},
	
    addOne: function(model) 
    {
		var self = this;
		
		var markerObj = {};
		markerObj.id = model.get('_id'); //May be the wrong ID
		markerObj.name = model.get('name');
		markerObj.location = model.get('location');
		markerObj.lat = model.get('lat');
		markerObj.lon = model.get('lon');
		markerObj.val = model.get('val');
	
		var input = markerObj.location.substring(0, markerObj.location.length);
		var latlngStr = input.split(",",2);
		var lat = parseFloat(latlngStr[0]);
		var lng = parseFloat(latlngStr[1]);
		latlngArray = new google.maps.LatLng(lat, lng);


		this.addPointWidget(this.createPointWidget(
			lat, lng, 1, {
				color: 0xff00000
			}));


    },

    addAll: function() {
      var self = this;
		this.collection.each(function(reading){ 
		self.addOne(reading);
	 	});
    }
  
});