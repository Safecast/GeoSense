window.MapGLView = Backbone.View.extend({

    tagName: 'div',
	className: 'map-gl',
	
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

	convertSphericalToCartesian: function(lat, lon, radiusOffset) {    
		var r = radius;
		if (radiusOffset) {
			r += radiusOffset;
		}
		var rLat = this.degToRad(lat);
		var rLon = this.degToRad(lon);
		
		var x = r * Math.cos(rLat)*Math.cos(rLon);    
		var y = r * Math.cos(rLat)*Math.sin(rLon);
		var z = r * Math.sin(rLat)*-1;    

 
		return new THREE.Vector3(x, y, z);
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
		//meshClouds.rotation.y += 1.25 * rotationSpeed * delta;

		//this.world.rotation.y += rotationSpeed * delta;

		for (var i = 0; i < this.widgets.length; i++) {
			//this.widgets[i].rotateAroundWorldAxis();
		}

		var angle = delta * rotationSpeed;

		controls.update();

		renderer.clear();
		renderer.render( scene, camera );
	},

    render: function() {
		$(this.el).html(this.template());
		
		container = this.el;
		scene = new THREE.Scene();

		renderer = new THREE.WebGLRenderer( { clearAlpha: 1, clearColor: 0xededed, antialias: true } );
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

		dirLight = new THREE.DirectionalLight( 0xFFFFFF );
		dirLight.position.set( -1, 0, 1 ).normalize();
		scene.add( dirLight );

		var planetTexture = THREE.ImageUtils.loadTexture( "textures/planets/earth_white.jpg" ),
		cloudsTexture     = THREE.ImageUtils.loadTexture( "textures/planets/earth_clouds_1024.png" ),
		normalTexture     = THREE.ImageUtils.loadTexture( "textures/planets/earth_normal_2048.jpg" ),
		specularTexture   = THREE.ImageUtils.loadTexture( "textures/planets/earth_specular_2048.jpg" );

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
		uniforms[ "uAmbientColor" ].value.setHex( 0x000000 );

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
		//world.rotation.z = tilt;
		this.world.add( meshPlanet );

		// clouds

		var materialClouds = new THREE.MeshLambertMaterial( { color: 0xffffff, map: cloudsTexture, transparent:true } );

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

		var stars,
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

		}


		// quick bar chart test

		var dataPoints = [
			[0, 0, 1.5],
			//[10, 10, .25],
			//[10, -10, .5],
			[-10, -5, .5],
			


			//[90, 0, 1.5]
			//,[80, 10, .25]
			//,[70, 20, .125]
			//,[80, 0, .5]
			//[0, -90, 1.5]


			//,[-19.47695,46.230469, 1]
//			,[-51.876491,-59.216309,1]

			/*,
			[60.737686, -45.087891, .8],
			[57.515823, -63.984375, .25],
			[12.21118, -84.023437, .6],
			[1.054628, 115.3125, .9],
			[65.07213, -23.203125, 1]*/ 
		];

		var barHeight = 3000;
		var barWidth = 100;
		var barRadiusOffset = 0;
		for (var i = 0; i < dataPoints.length; i++) {
			var color = Math.random() * 0xffffff;
			var materials = [];
			for ( var c = 0; c < 6; c ++ ) {
				//materials.push( new THREE.MeshBasicMaterial( { color: color, transparent: true, blending: THREE.AdditiveBlending } ) );
				materials.push( new THREE.MeshLambertMaterial( { color: color, shading: THREE.FlatShading } ) );
			}

			var barH = dataPoints[i][2] * barHeight;
			var cube = new THREE.Mesh( new THREE.CubeGeometry(barWidth, barWidth, barH, 1, 1, 1, materials ), new THREE.MeshFaceMaterial() );
			cube.position = this.convertSphericalToCartesian(dataPoints[i][0], dataPoints[i][1], barRadiusOffset + barH / 2);
			cube.lookAt(meshPlanet.position);
			this.world.add( cube );   
			this.widgets.push(cube);

			var sphereGeometry = new THREE.SphereGeometry( barWidth * .7, 100, 50 );
			sphereGeometry.computeTangents();
			var sphere = new THREE.Mesh(sphereGeometry, materialNormalMap );
			sphere.position = cube.position;
			this.world.add(sphere);

			this.widgets.push(sphere);
		}

		var light = new THREE.DirectionalLight( 0xffffff );
		light.position.set( 0, radius * 2, radius * 2 );
		scene.add( light );
		var light = new THREE.DirectionalLight( 0xffffff );
		light.position.set(radius * 2, radius * 2, 0 );
		scene.add( light );
				

        return this;
    },

	start: function() {
	
	},
	
    addOne: function(reading) {
		var self = this;
    },

    addAll: function() {
      var self = this;
		this.collection.each(function(reading){ 
		self.addOne(reading);
	 	});
    }
  
});