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
		_.bindAll(this, "updateValueScale");
		_.bindAll(this, "updateTaggedObject");
	 	options.vent.bind("updateValueScale", this.updateValueScale);
	 	options.vent.bind("updateTaggedObject", this.updateTaggedObject);
		new OblessdClient({vent: options.vent, taggedObjects: taggedObjects});
    	this.tweens = {};
    },

    updateTaggedObject: function(obj)
    {
    	if (!this.globe) return;
		switch (obj.name) {
			case 'globe':
				this.globe.world.position = new THREE.Vector3().copy(obj.loc);
				break;
			case 'lens':

				this.globe.camera.position = new THREE.Vector3().copy(obj.loc);

				/*if (!this.tweens.cameraPosition) {
				    this.tweens.cameraPosition = new TWEEN.Tween(this.globe.camera.position);
				}
				this.tweens.cameraPosition.stop();
				this.tweens.cameraPosition.to(new THREE.Vector3().copy(obj.loc), SMOOTH_TWEEN_DURATION);
				this.tweens.cameraPosition.start();*/


				var invNorm = new THREE.Vector3().copy(obj.norm).multiplyScalar(-1);
				var newLookAt = new THREE.Vector3().add(obj.loc, invNorm);
				this.globe.camera.lookAt(newLookAt);

				
				break;

				if (!this.lookAt) {
					this.i = 0;
					var self = this;
					this.lookAt = newLookAt;
					this.lookAtTween = new TWEEN.Tween(this.lookAt);
					this.lookAtTween.onUpdate(function() {
						console.log('update');
						self.globe.camera.lookAt(self.lookAt);
					});
				} else {
					this.i++;
					if (this.i % 100 == 0) {
						console.log('tween');
						console.log(this.lookAt);
						console.log(newLookAt);
						this.lookAtTween.stop();
						this.lookAtTween.to(newLookAt, 1000);
						this.lookAtTween.start();
					}
				}

				break;
		}


/*        if (obj[GLOBE_TAG]) {
        	var newLoc = obj[GLOBE_TAG].loc;
			var f = VIRTUAL_PHYSICAL_FACTOR;
            this.globe.world.position = new THREE.Vector3(
              newLoc[0] * f, 
              newLoc[1] * f, 
              newLoc[2] * f
            );
        }
        if (obj[LENS_TAG]) {

        	var newLoc = obj[LENS_TAG].loc;
			var pos = new THREE.Vector3(
              newLoc[0] * f, 
              newLoc[1] * f, 
              newLoc[2] * f
            );
        	var newLoc = obj[LENS_TAG].norm;
			var dir = new THREE.Vector3(
              newLoc[0], 
              newLoc[1], 
              newLoc[2]
            );
            dir.multiplyScalar(-1000);
            var look = new THREE.Vector3();
            look.add(pos, dir);
            dir.multiplyScalar(f);

			this.globe.camera.position = pos;
			this.globe.camera.lookAt(look);

			//console.log(dir);	
//	        this.globe.camera.lookAt(look);

			//this.globe.camera.position = pos;	
            //this.globe.camera.lookAt(dir);

          /*if (!initialGlobeLoc) {
            initialGlobeLoc = obj[globeTag].loc;
          }
          if (THREEx && THREEx.world) {
            var newLoc = obj[GLOBE_TAG].loc;
            var f = realWorldToVirtualFactor;
            THREEx.world.position = new THREE.Vector3(
              (newLoc[0] - initialGlobeLoc[0]) * f, 
              (newLoc[1] - initialGlobeLoc[1]) * f, 
              (newLoc[2] - initialGlobeLoc[2]) * f
            );
          }
        }
          */

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

		this.stats.update();
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
		if (IS_IPAD) {
			$('body').addClass('ipad');
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
	
	},

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
	
	addCollectionToMap: function(collection)
	{
		var self = this;
		var data = [];
		var maxVal = 0;
		collection.each(function(model) {
			self.cleanPointModel(model);
			data.push(model.get('lat'));
			data.push(model.get('lon'));
			var val = model.get('val');
			if (val == 0) {
				val = Math.random() * .5;
			}
			if (val > maxVal) {
				maxVal = val;
			}
			data.push(val);
		});
		if (maxVal > 1) {
			console.log('normalizing to '+maxVal+' ('+this.valueScale+')');
			var scaleFuncs = {
				linear: function(v) { return v },
				log: Math.log
			};
			var scale = scaleFuncs[this.valueScale];
			var max = scale(maxVal);
			for (var i = 2; i < data.length; i += 3) {
				//console.log(data[i]+' ==> '+  (scale(data[i]) / max));
				data[i] = scale(data[i]) / max;
			}
		}
		this.globe.addData(data, {format: 'magnitude', name: collection.get('_id'), animated: false});
		this.globe.createPoints();

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