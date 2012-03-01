window.MapGLView = Backbone.View.extend({

    tagName: 'div',
	className: 'mapgl-view',
	
    events: {
    },

    initialize: function(options) {
	
	    this.template = _.template(tpl.get('mapgl'));
	
		this.collection.bind('add',   this.addOne, this);
		this.collection.bind('reset', this.addAll, this);
				
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

		meshPlanet.rotation.y += rotationSpeed * delta;
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

		renderer = new THREE.WebGLRenderer( { clearAlpha: 1, clearColor: 0xffffff, antialias: true } );
		renderer.setSize( width, height );
		renderer.sortObjects = false;
		renderer.autoClear = false;

		//

		renderer.gammaInput = true;
		renderer.gammaOutput = true;

		//

		container.appendChild( renderer.domElement );

		camera = new THREE.PerspectiveCamera( 25, window.innerWidth / window.innerHeight, 50, 1e7 );
		camera.position.z = radius * 7;
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
		meshPlanet.rotation.y = 0;
		meshPlanet.rotation.z = tilt;
		scene.add( meshPlanet );


		// clouds

		var materialClouds = new THREE.MeshLambertMaterial( { color: 0xffffff, map: cloudsTexture, transparent:true } );

		meshClouds = new THREE.Mesh( geometry, materialClouds );
		meshClouds.scale.set( cloudsScale, cloudsScale, cloudsScale );
		meshClouds.rotation.z = tilt;
		scene.add( meshClouds );


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