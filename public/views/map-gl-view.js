window.MapGLView = window.MapViewBase.extend({

    tagName: 'div',
	className: 'map-gl-view',
	
    events: {
    },

    widgets: {},
    world: null,

    valueScale: 'linear',

    defaultPointColor: 0x888888	,

    initialize: function(options) {
		MapGLView.__super__.initialize.call(this, options)
	    this.template = _.template(tpl.get('map-gl'));
	 	options.vent.bind("updateValueScale", this.updateValueScale);
		_.bindAll(this, "updateValueScale");
	 	options.vent.bind("updateTaggedObject", this.updateTaggedObject);
		_.bindAll(this, "updateTaggedObject");
    	this.tweens = {};
    },

	getVisibleMapArea: function()
	{
		return {
			bounds: [[-180, -90], [180, 90]],
			zoom: 0
		};
	},

	getMatrixFromTag: function(obj, switchON) {
		var norm = !switchON ? obj.norm.normalize() : obj.over.normalize();
		var over = !switchON ? obj.over.normalize() : obj.norm.normalize();
		var up = new THREE.Vector3().cross(obj.norm, obj.over).normalize();
		var matrix = new THREE.Matrix4(
			over.x, up.x, norm.x, 0,
			over.y, up.y, norm.y, 0,
			over.z, up.z, norm.z, 0,
			0, 0, 0, 1
		);
		return matrix;
	},

    updateTaggedObject: function(obj)
    {
    	if (!this.globe) return;

    	//console.log(obj.name);
		switch (obj.name) {
			case 'globe':
				if (!IS_AR && !IS_TAGGED_GLOBE && !IS_LOUPE) break;
				// get tag matrix
				var matrix = this.getMatrixFromTag(obj);
				var rotMatrix = new THREE.Matrix4();
				rotMatrix.setRotationX(WORLD_ROT_X);
				matrix.multiplySelf(rotMatrix);
				rotMatrix.setRotationY(WORLD_ROT_Y);
				matrix.multiplySelf(rotMatrix);
				rotMatrix.setRotationZ(WORLD_ROT_Z);
				matrix.multiplySelf(rotMatrix);

				// copy rotation from that matrix to globe
				this.globe.world.rotation = new THREE.Vector3().getRotationFromMatrix(matrix);
				// copy tag location to new vector
				var newGlobePos = new THREE.Vector3().copy(obj.loc);
				// translate location by radius along inverse of tag normal 
				var invNorm = new THREE.Vector3().copy(obj.norm).normalize().multiplyScalar(-1);
				newGlobePos.addSelf(invNorm.multiplyScalar(VIRTUAL_PHYSICAL_FACTOR * radius));
				// update globe position
				this.globe.world.position = newGlobePos;

				if (DEBUG && this.globe.debugMarker) {
					this.globe.debugMarker.rotation.getRotationFromMatrix(matrix);
					this.globe.debugMarker.position = new THREE.Vector3().copy(obj.loc);
				}

		    	if (IS_TAGGED_GLOBE && !IS_AR && (!IS_LOUPE || IS_TOP_DOWN)) {
					this.globe.camera.position = new THREE.Vector3().copy(this.globe.world.position);
		    		this.globe.camera.position.y += WORLD_FIXED_DIST;
					if (!IS_TOP_DOWN) {
						this.globe.camera.position.z += WORLD_FIXED_DIST * .4; 
					} else {
						var rotMatrix = new THREE.Matrix4();
						this.globe.camera.up.getRotationFromMatrix(rotMatrix);
					}
					this.globe.camera.lookAt(this.globe.world.position);
		    	}

				break;
			case 'lens':
		    	if (!IS_AR && !IS_LOUPE) break;

				// look at camera position plus inverse norm vector of lens tag
				var invNorm;
				if (!IS_GESTURAL) {
					invNorm = new THREE.Vector3().copy(obj.norm).multiplyScalar(-1);
				} else {
					invNorm = new THREE.Vector3().copy(obj.over);
				}

		    	if (!IS_TOP_DOWN) {
					// set camera position and up vectors to respective lens tag vectors
					this.globe.camera.position = new THREE.Vector3().copy(obj.loc);
					this.globe.camera.up = new THREE.Vector3().cross(obj.norm, obj.over);
					var newLookAt = new THREE.Vector3().add(obj.loc, invNorm);
					this.globe.camera.lookAt(newLookAt);
		    	}

				if (IS_LOUPE) {					

					var ray = new THREE.Ray(obj.loc, invNorm);
					var intersect = ray.intersectObject(this.globe.planetExtents);

					if (intersect && intersect.length) {
						console.log('intersect');
						var i = intersect[0];
						var loupeDist = Math.min(Math.abs(i.distance - LOUPE_FOCAL_DISTANCE), LOUPE_FOCAL_DISTANCE);
						var zoom = (LOUPE_FOCAL_DISTANCE - loupeDist) / LOUPE_FOCAL_DISTANCE;

						var newFov = CAMERA_FOV - LOUPE_STRENGTH * zoom;

						if (!IS_TOP_DOWN && this.globe.camera.fov != newFov) {
							this.globe.camera.fov = newFov;
							this.globe.camera.updateProjectionMatrix(); 						
						}

						if (IS_TOP_DOWN) {
							this.globe.roiMarker.position = new THREE.Vector3().copy(this.globe.world.position);
							this.globe.roiMarker.rotation = new THREE.Vector3().getRotationFromMatrix(this.getMatrixFromTag(obj, IS_GESTURAL));
							this.globe.roiMarker.position.addSelf(invNorm.multiplyScalar(-radius));
							var roiScale = 1 - zoom;
							var roiSize = 300;
							this.globe.roiMarker.scale.x = roiScale * roiSize;
							this.globe.roiMarker.scale.y = roiScale * roiSize;
							this.globe.roiMarker.visible = true;
						}
					} else {
						this.globe.roiMarker.visible = false;
					}

					/*
					var loupePos = invNorm.multiplyScalar(300);
					console.log(loupePos.length());
					console.log('loupe');
					this.globe.camera.position.x += 100;
					*/
				}
				
				break;
		}

    },
	
	animate: function() {
		var self = this;
		
		var r = function() {
			requestAnimationFrame(r);
			self.renderLoop();
		};
		r();
		
		/*
		var loopTimer = 16;
		animationLoop = setInterval(function() {
			self.renderLoop();
		}, loopTimer);
		*/
	},

	renderLoop: function() {
				
		var delta = clock.getDelta();
		this.globe.render();

		/*
		//meshPlanet.rotation.y += rotationSpeed * delta;
		this.world.rotation.y += rotationSpeed * delta;
		//meshClouds.rotation.y += 1.25 * rotationSpeed * delta;

		var angle = delta * rotationSpeed;

		controls.update();
		

		renderer.clear();
		renderer.render( scene, camera );
		*/

		if (this.stats) this.stats.update();
		TWEEN.update();
	},

	updateValueScale: function(scale) {
		this.valueScale = scale;
		for (var i in this.collections) {
			this.removeCollectionFromMap(this.collections[i]);
			this.addCollectionToMap(this.collections[i]);
		}
	},

	removeCollectionFromMap: function(model) {
		var id = model.pointCollectionId;
		if (!this.widgets[id]) return;
		var w = this.widgets[id];
		for (var i = 0; i < w.length; i++) {
			this.world.remove(w[i].object3D);   
		}
		delete this.widgets[id];
	},

    render: function() {
		$(this.el).html(this.template());
		if (IS_IPAD) {
			$('body').addClass('ipad');
		}
		if (IS_AR) {
			$('body').addClass('ar-lens');
		}

    	if (DEBUG) {
			this.stats = new Stats();
			this.stats.domElement.style.position = 'absolute';
			this.stats.domElement.style.top = '0px';
			this.el.appendChild(this.stats.domElement);
    	}
		
		container = this.el;
	    this.globe = new DAT.Globe(container);

	    this.animate();
		this.vent.trigger('mapViewReady');

	    /*
	    var data = [];
	    var step = 5;
	    for (var lat = -180; lat < 180; lat += step / 2) {
		    for (var lng = -90; lng < 90; lng += step) {
		    	data.push(lat);
		    	data.push(lng);
		    	data.push(Math.random());
		    }
	    }
	    console.log(data.length/2);
		this.globe.addData(data, {format: 'magnitude', name: 'test', animated: false});
		this.globe.createPoints();
		*/

	    return this;



		THREEx.WindowResize(renderer, camera);


        return this;
    },


	start: function() {
		MapGLView.__super__.start.call(this);
	},

	/*
	createPointWidget: function(cls, lat, lng, val, initObj)
	{
		//var position = this.convertSphericalToCartesian(lat, lng);
		//return new cls(position, val, initObj);
		return  new cls(new THREE.Vector3(), val, initObj);
	},

	addPointWidget: function(model, widget) 
	{
		return;
		widget.object3D.lookAt(meshPlanet.position);
		this.world.add(widget.object3D);   
		var id = model.get('collectionid');
		if (!this.widgets[id]) {
			this.widgets[id] = [];
		}
		this.widgets[id].push(widget);
	},
	*/

	/**
	* Required to be implemented by descendants.
	*/
	initLayerForCollection: function(collection)
	{
		MapGLView.__super__.initLayerForCollection.call(this, collection);
		this.featureLayers[collection.pointCollectionId] = {
			data: [],
			colors: []
		}; 
	},


	/**
	* Required to be implemented by descendants.
	*/
    addPointToLayer: function(model, opts, collectionId) 
    {
    	var loc = model.get('loc');
    	this.featureLayers[collectionId].data.push(loc[1]);
    	this.featureLayers[collectionId].data.push(loc[0]);
    	var val = model.get('val') / opts.max;
    	this.featureLayers[collectionId].data.push(val);
    	this.featureLayers[collectionId].colors.push(
    		opts.color.replace('#', '0x'));
    },

	/**
	* Required to be implemented by descendants.
	*/
	drawLayerForCollection: function(collection) 
	{
		var colorIndex = 0;
		var self = this;
		this.globe.addData(this.featureLayers[collection.pointCollectionId].data, {
			format: 'magnitude', 
			name: collection.get('_id'), 
			animated: false,
			colorFn: function(val) {
				var c = new THREE.Color();
				c.setHex(self.featureLayers[collection.pointCollectionId].colors[colorIndex]);
				colorIndex++;
				return c;
			}
		});
		this.globe.createPoints();
	},

	setVisibleMapArea: function(result)
	{
	},

    /*addOne: function(model) 
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
    */

	addOneComment: function(model) {
		//If we want to add comments to globe
    },
  
});