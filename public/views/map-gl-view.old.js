window.MapGLView = window.MapViewBase.extend({

    tagName: 'div',
	className: 'map-gl-view',
	
    events: {
    },

    widgets: {},
    world: null,

    defaultPointColor: 0x888888	,

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

		//console.log(lat+','+lon+' ==> '+x+','+y+','+z);

		return this.latLngRotationMatrix.multiplyVector3(vec);
	},

	convertCartesianToSpherical: function(v) {    
		var r = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);     
		var lat = this.radToDeg(Math.asin(v.z / r));    
		var lon = this.radToDeg(Math.atan2(v.y, v.x));    
		return [lat, lon];
	},

    initialize: function(options) {
		MapGLView.__super__.initialize.call(this, options)
	    this.template = _.template(tpl.get('map-gl'));
		this.animate();

		this.latLngRotationMatrix.setRotationAxis(new THREE.Vector3(1, 0, 0), -Math.PI/2);
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
		//meshClouds.rotation.y += 1.25 * rotationSpeed * delta;

		var angle = delta * rotationSpeed;

		controls.update();

		renderer.clear();
		renderer.render( scene, camera );

		this.stats.update();
	},

	removeCollectionFromMap: function(model) {
		var id = model.collectionId;
		if (!this.widgets[id]) return;
		var w = this.widgets[id];
		for (var i = 0; i < w.length; i++) {
			this.world.remove(w[i].object3D);   
		}
		delete this.widgets[id];
	},

    render: function() {
		$(this.el).html(this.template());

    	if (DEBUG) {
			this.stats = new Stats();
			this.stats.domElement.style.position = 'absolute';
			this.stats.domElement.style.top = '0px';
			this.el.appendChild(this.stats.domElement);
    	}
		
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

		this.world = THREEx.world = new THREE.Object3D();
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

		this.world = THREEx.world = new THREE.Object3D();
		scene.add(this.world);

		dirLight = new THREE.DirectionalLight( 0xdddddd );
		dirLight.position.set( -1, 0, 1 ).normalize();
		scene.add( dirLight );

		var planetTexture = THREE.ImageUtils.loadTexture( "assets/textures/planets/earth_white.jpg" ),
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
		//this.world.add( meshClouds );

		// stars

		var i,
		vector,
		starsGeometry = new THREE.Geometry();

		for ( i = 0; i < 1500; i ++ ) {

			vector = new THREE.Vector3( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 );
			vector.multiplyScalar( radius );

			starsGeometry.vertices.push( new THREE.Vertex( vector ) );

		}

		/*var light = new THREE.DirectionalLight( 0xffffff );
		light.position.set( 0, radius * 2, radius * 2 );
		scene.add( light );*/

		scene.add(new THREE.AmbientLight( 0xffffff ));				

		THREEx.WindowResize(renderer, camera);


        return this;
    },


	start: function() {
	
	},

	createPointWidget: function(cls, lat, lng, val, initObj)
	{
		var position = this.convertSphericalToCartesian(lat, lng);
		return new cls(position, val, initObj);
	},

	addPointWidget: function(model, widget) 
	{
		widget.object3D.lookAt(meshPlanet.position);
		this.world.add(widget.object3D);   
		var id = model.get('collectionid');
		if (!this.widgets[id]) {
			this.widgets[id] = [];
		}
		this.widgets[id].push(widget);
	},
	
    addOne: function(model) 
    {
		var self = this;
		var pointColor = model.get('color');
		if (pointColor) {
			pointColor = parseInt(pointColor.replace('#', '0x'));
		}
		var val = model.get('val');
		if (val == 0) {
			val = .1;
		}
		if (val > 1) {
			val = 50/val;
		}
		this.addPointWidget(model, this.createPointWidget(THREEx.PointWidget,
			model.get('lat'), model.get('lon'), val, {
				color: pointColor || this.defaultPointColor
			}));

    },
  
});