/**
 * dat.globe Javascript WebGL Globe Toolkit
 * http://dataarts.github.com/dat.globe
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

var DAT = DAT || {};

DAT.Globe = function(container, colorFn) {

  colorFn = colorFn || function(x) {
    var c = new THREE.Color();
    if (x == 0) {
      c.setHex(0x999999);
    } else {
      c.setHSV( ( 0.6 - ( x * 0.5 ) ), 1.0, .7 );
    }
    return c;
  };

  var Shaders = {
    'earth' : {
      uniforms: {
        'texture': { type: 't', value: 0, texture: null }
      },
      vertexShader: [
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
          'vNormal = normalize( normalMatrix * normal );',
          'vUv = uv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D texture;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'vec3 diffuse = texture2D( texture, vUv ).xyz;',
          'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
          'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
          'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
        '}'
      ].join('\n')
    },
    'atmosphere' : {
      uniforms: {},
      vertexShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'vNormal = normalize( normalMatrix * normal );',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
          'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
        '}'
      ].join('\n')
    }
  };

  var camera, scene, scenePoints, world, sceneAtmosphere, renderer, w, h;
  var meshPlanet, atmosphere, point;
  var controls;

  var overRenderer;

  var imgDir = 'assets/textures/planets/';

  var curZoomSpeed = 0;
  var zoomSpeed = 50;

  var mouse = { x: 0, y: 0 }, mouseOnDown = { x: 0, y: 0 };
  var rotation = { x: 0, y: 0 },
      target = { x: Math.PI*3/2, y: Math.PI / 6.0 },
      targetOnDown = { x: 0, y: 0 };

  var distance = distanceTarget = radius * 7;
  var padding = 40;
  var PI_HALF = Math.PI / 2;

  var barWidth = 50;
  var barHeight = radius / 2.5;

  function init() {

    var shader, uniforms, material;
    w = container.offsetWidth || window.innerWidth;
    h = container.offsetHeight || window.innerHeight;

    scene = new THREE.Scene();
    sceneAtmosphere = new THREE.Scene();
    scenePoints = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(25, w / h, 50, 1e7);
    camera.position.z = distance;
    scene.add( camera );


    var geometry = new THREE.SphereGeometry(radius, 80, 60);

    /*
    shader = Shaders['earth'];
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    uniforms['texture'].texture = THREE.ImageUtils.loadTexture(imgDir + 'earth_white.jpg');

    material = new THREE.MeshShaderMaterial({

          uniforms: uniforms,
          vertexShader: shader.vertexShader,
          fragmentShader: shader.fragmentShader

        });

    mesh = new THREE.Mesh(geometry, material);
    mesh.matrixAutoUpdate = false;
    scene.addObject(mesh);
    */

    world = new THREE.Object3D();
    scene.add(world);
    world.rotation.y = 90;

    dirLight = new THREE.DirectionalLight( 0xdddddd );
    dirLight.position.set( -1, 0, 1 ).normalize();
    scene.add( dirLight );

    var planetTexture = THREE.ImageUtils.loadTexture( "/assets/textures/planets/earth_grey.jpg" ),
    cloudsTexture     = THREE.ImageUtils.loadTexture( "/assets/textures/planets/earth_clouds_1024.png" ),
    normalTexture     = THREE.ImageUtils.loadTexture( "/assets/textures/planets/earth_normal_2048.jpg" ),
    specularTexture   = THREE.ImageUtils.loadTexture( "/assets/textures/planets/earth_specular_2048.jpg" );

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
      lights: true,

    });

    var materialNormalMap = new THREE.MeshBasicMaterial( { 
      color: Math.random() * 0xffffff,
      opacity: .000001 
    } 

    );

    // planet

    
    geometry = new THREE.SphereGeometry( radius, 80, 60 );
    geometry.computeTangents();

    meshPlanet = new THREE.Mesh( geometry, materialNormalMap );
    meshPlanet.rotation.y = 0;
    world.rotation.z = tilt;
    world.add( meshPlanet );
  
    scene.add(new THREE.AmbientLight( 0xffffff ));        


    /*
    shader = Shaders['atmosphere'];
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    material = new THREE.MeshShaderMaterial({
        uniforms: uniforms,
        vertexShader: shader.vertexShader,
        fragmentShader: shader.fragmentShader
    });

    mesh = new THREE.Mesh(geometry, material);
    mesh.scale.x = mesh.scale.y = mesh.scale.z = 2.1;
    mesh.flipSided = true;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    scene.addObject(mesh);
    */

    
    geometry = new THREE.CubeGeometry(barWidth, barWidth, 1, 1, 0, false, { px: true,
          nx: true, py: true, ny: true, pz: false, nz: true});

    for (var i = 0; i < geometry.vertices.length; i++) {

      var vertex = geometry.vertices[i];
      vertex.position.z += 0.5;

    }

    point = new THREE.Mesh(geometry);


    renderer = new THREE.WebGLRenderer( { clearAlpha: 0, clearColor: 0x000000, antialias: true } );
    renderer.setSize( width, height );
    renderer.sortObjects = false;
    renderer.autoClear = false;
    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    renderer.domElement.style.position = 'absolute';

    container.appendChild(renderer.domElement);

    container.addEventListener('mousewheel', onMouseWheel, false);

    window.addEventListener('resize', onWindowResize, false);

    container.addEventListener('mouseover', function() {
      overRenderer = true;
    }, false);

    container.addEventListener('mouseout', function() {
      overRenderer = false;
    }, false);

    /*
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
    */


  var renderWorld = new THREE.RenderPass( scene, camera );
	var renderPoints = new THREE.RenderPass( scenePoints, camera );
  renderPoints.clear = false;
  var renderPointsMask = new THREE.MaskPass( scenePoints, camera );
	var effectBloom = new THREE.BloomPass( .8 );
	var effectScreen = new THREE.ShaderPass( THREE.ShaderExtras[ "screen" ] );
	var effectFXAA = new THREE.ShaderPass( THREE.ShaderExtras[ "fxaa" ] );

	effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );

	effectScreen.renderToScreen = true;

	composer = new THREE.EffectComposer( renderer );

  composer.addPass( renderWorld );
  composer.addPass( renderPoints );
  composer.addPass( effectFXAA );
	composer.addPass( effectBloom );
	composer.addPass( effectScreen );

  }

  addData = function(data, opts) {
    var lat, lng, size, color, i, step, colorFnWrapper;

    opts.animated = opts.animated || false;
    this.is_animated = opts.animated;
    opts.format = opts.format || 'magnitude'; // other option is 'legend'
    console.log(opts.format);
    if (opts.format === 'magnitude') {
      step = 3;
      colorFnWrapper = function(data, i) { return colorFn(data[i+2]); }
    } else if (opts.format === 'legend') {
      step = 4;
      colorFnWrapper = function(data, i) { return colorFn(data[i+3]); }
    } else {
      throw('error: format not supported: '+opts.format);
    }

    if (opts.animated) {
      if (this._baseGeometry === undefined) {
        this._baseGeometry = new THREE.Geometry();
        for (i = 0; i < data.length; i += step) {
          lat = data[i];
          lng = data[i + 1];
//        size = data[i + 2];
          color = colorFnWrapper(data,i);
          size = 0;
          addPoint(lat, lng, size, color, this._baseGeometry);
        }
      }
      if(this._morphTargetId === undefined) {
        this._morphTargetId = 0;
      } else {
        this._morphTargetId += 1;
      }
      opts.name = opts.name || 'morphTarget' + this._morphTargetId;
    }
    var subgeo = new THREE.Geometry();
    for (i = 0; i < data.length; i += step) {
      lat = data[i];
      lng = data[i + 1];
      color = colorFnWrapper(data,i);
      size = data[i + 2];
      size = Math.max(size * barHeight, 100);
      addPoint(lat, lng, size, color, subgeo);
    }
    if (opts.animated) {
      this._baseGeometry.morphTargets.push({'name': opts.name, vertices: subgeo.vertices});
    } else {
      this._baseGeometry = subgeo;
    }

  };

  function createPoints() {
    if (this._baseGeometry !== undefined) {
      if (this.is_animated === false) {
        this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
              color: 0xffffff,
              vertexColors: THREE.FaceColors,
              morphTargets: false,
              transparent: true, blending: THREE.AdditiveBlending
            }));
      } else {
        if (this._baseGeometry.morphTargets.length < 8) {
          console.log('t l',this._baseGeometry.morphTargets.length);
          var padding = 8-this._baseGeometry.morphTargets.length;
          console.log('padding', padding);
          for(var i=0; i<=padding; i++) {
            console.log('padding',i);
            this._baseGeometry.morphTargets.push({'name': 'morphPadding'+i, vertices: this._baseGeometry.vertices});
          }
        }
        this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
              color: 0xffffff,
              vertexColors: THREE.FaceColors,
              morphTargets: true,
              //transparent: true, blending: THREE.AdditiveBlending
            }));
      }
      world.add(this.points);
    }
  }

  function addPoint(lat, lng, size, color, subgeo) {
    var phi = (90 - lat) * Math.PI / 180;
    var theta = (-lng) * Math.PI / 180;

    var r = radius * 1.001;

    point.position.x = r * Math.sin(phi) * Math.cos(theta);
    point.position.y = r * Math.cos(phi);
    point.position.z = r * Math.sin(phi) * Math.sin(theta);

    point.lookAt(meshPlanet.position);

    point.scale.z = -size;
    point.updateMatrix();

    var i;
    for (i = 0; i < point.geometry.faces.length; i++) {
      point.geometry.faces[i].color = color;
      point.geometry.faces[i].materialIndex = undefined;
    }

    THREE.GeometryUtils.merge(subgeo, point);
  }

  function onMouseWheel(event) {
    event.preventDefault();
    if (overRenderer) {
      controls._zoomStart = controls._zoomEnd = event.wheelDeltaY;
      console.log(controls);
      //zoom(event.wheelDeltaY * 0.3);
    }
    return false;
  }

  function onWindowResize( event ) {
    console.log('resize');
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }

  function animate() {
    requestAnimationFrame(animate);
    render();
  }

  function render() {
    /*
    zoom(curZoomSpeed);

    rotation.x += (target.x - rotation.x) * 0.1;
    rotation.y += (target.y - rotation.y) * 0.1;
    distance += (distanceTarget - distance) * 0.3;

    camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
    camera.position.y = distance * Math.sin(rotation.y);
    camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);

    vector.copy(camera.position);
    */

    world.rotation.y += 0.0025;
	  scenePoints.rotation = world.rotation;
    
    /*
    var helper = new THREE.AxisHelper(); 
    helper.scale.x = helper.scale.y = helper.scale.z = 1000;
    world.add(helper);
    */

   // THREE.SceneUtils.showAxis(scene);

    //controls.update();

    renderer.clear();
    renderer.render(scene, camera);
    renderer.render(scenePoints, camera);


    //composer.render();
	
  }

  init();
  this.animate = animate;
  this.render = render;
  this.world = world;
  this.camera = camera;

  this.__defineGetter__('time', function() {
    return this._time || 0;
  });

  this.__defineSetter__('time', function(t) {
    var validMorphs = [];
    var morphDict = this.points.morphTargetDictionary;
    for(var k in morphDict) {
      if(k.indexOf('morphPadding') < 0) {
        validMorphs.push(morphDict[k]);
      }
    }
    validMorphs.sort();
    var l = validMorphs.length-1;
    var scaledt = t*l+1;
    var index = Math.floor(scaledt);
    for (i=0;i<validMorphs.length;i++) {
      this.points.morphTargetInfluences[validMorphs[i]] = 0;
    }
    var lastIndex = index - 1;
    var leftover = scaledt - index;
    if (lastIndex >= 0) {
      this.points.morphTargetInfluences[lastIndex] = 1 - leftover;
    }
    this.points.morphTargetInfluences[index] = leftover;
    this._time = t;
  });

  this.addData = addData;
  this.createPoints = createPoints;
  this.renderer = renderer;
  this.scene = scene;

  console.log(this.world);
  return this;

};

