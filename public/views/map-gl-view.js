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
    	this.tweens = {};
    },

	getVisibleMapArea: function()
	{
		return {
			bounds: [[-180, -90], [180, 90]],
			zoom: -1
		};
	},

    updateTaggedObject: function(obj)
    {
    	if (!this.globe) return;

		switch (obj.name) {
			case 'globe':
				// get tag matrix
				var norm = obj.norm.normalize();
				var over = obj.over.normalize();
				var up = new THREE.Vector3().cross(obj.norm, obj.over).normalize();
				var matrix = new THREE.Matrix4(
					over.x, up.x, norm.x, 0,
					over.y, up.y, norm.y, 0,
					over.z, up.z, norm.z, 0,
					0, 0, 0, 1
				);
				//	rotMatrix.setRotationZ(-Math.PI);
				//rotMatrix.setRotationZ(-Math.PI);
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
				newGlobePos.addSelf(invNorm.multiplyScalar(VIRTUAL_PHYSICAL_FACTOR * 200));
				// update globe position
				this.globe.world.position = newGlobePos;

				if (DEBUG && this.globe.debugMarker) {
					this.globe.debugMarker.rotation.getRotationFromMatrix(matrix);
					this.globe.debugMarker.position = new THREE.Vector3().copy(obj.loc);
				}

		    	if (!IS_AR) {
					this.globe.camera.position = new THREE.Vector3().copy(this.globe.world.position);
					this.globe.camera.position.z += radius * 2; 
		    		this.globe.world.position.y -= radius * 2.5;
					this.globe.camera.lookAt(this.globe.world.position);
		    	}

				break;
			case 'lens':
		    	if (!IS_AR) break;
				// set camera position and up vectors to respective lens tag vectors
				this.globe.camera.position = new THREE.Vector3().copy(obj.loc);
				this.globe.camera.up = new THREE.Vector3().cross(obj.norm, obj.over);
				this.globe.camera.updateProjectionMatrix();

				// look at camera position plus inverse norm vector of lens tag
				var invNorm = new THREE.Vector3().copy(obj.norm).multiplyScalar(-1);
				var newLookAt = new THREE.Vector3().add(obj.loc, invNorm);
				this.globe.camera.lookAt(newLookAt);
				
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
		this.vent.trigger('mapReady');

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
		this.layerArray[collection.collectionId] = {
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
    	this.layerArray[collectionId].data.push(loc[1]);
    	this.layerArray[collectionId].data.push(loc[0]);
    	var val = model.get('val') / opts.max;
    	this.layerArray[collectionId].data.push(val);
    	this.layerArray[collectionId].colors.push(
    		opts.color.replace('#', '0x'));
    },

	/**
	* Required to be implemented by descendants.
	*/
	drawLayerForCollection: function(collection) 
	{
		var colorIndex = 0;
		var self = this;
		this.globe.addData(this.layerArray[collection.collectionId].data, {
			format: 'magnitude', 
			name: collection.get('_id'), 
			animated: false,
			colorFn: function(val) {
				var c = new THREE.Color();
				c.setHex(self.layerArray[collection.collectionId].colors[colorIndex]);
				colorIndex++;
				return c;
			}
		});
		this.globe.createPoints();
	},



	_addCollectionToMap: function(collection)
	{
		var self = this;
		this.vent.trigger("setStateType", 'drawing');

		this.__addData = []; 				
		MapOLView.__super__.addCollectionToMap.call(this, collection);

		this.globe.addData(this.__addData, {
			format: 'magnitude', 
			name: collection.get('_id'), 
			animated: false,
			/*colorFn: function(val) {
				
				//var rainbow = new Rainbow();
				//rainbow.setSpectrum(colorlow, colorhigh);		
				//rainbow.setNumberRange(0, 1);
				
				var c = new THREE.Color();
				c.setHex("0x" + color);
				return c;
			}*/
		});
		this.globe.createPoints();

		this.vent.trigger("setStateType", 'complete');	
	},

    _addOne: function(model, collectionId) {
		var self = this;
		//Prep point for layer	
		var collectionId = collectionId; 
		var label = model.get('name');
		var loc = model.get('loc');
		var lng = loc[0];
		var lat = loc[1];
		var val = model.get('val');
		var color = this.collections[collectionId].params.color;
		var colorlow = this.collections[collectionId].params.colorLow;
		var colorhigh = this.collections[collectionId].params.colorHigh;
		var colorType = this.collections[collectionId].params.colorType;
		//var drawType = this.collections[collectionId].params.drawType;
		
		//Set min/max values		
		var maxVal = this.collections[collectionId].maxVal;
		var minVal = this.collections[collectionId].minVal;
		
		if(colorType == 1) // Single color
		{
			gocolor = color;
		}
		else if(colorType == 2) // Color range
		{
			var rainbow = new Rainbow();
			rainbow.setSpectrum(colorlow, colorhigh);		
			rainbow.setNumberRange(Number(minVal), Number(maxVal));

			var hex = '#' + rainbow.colourAt(val);
			gocolor = hex;
		}
					
		console.log('gl addone');
		this.__addData.push(lat);		
		this.__addData.push(lng);		
		this.__addData.push(val);		
    },

	
	__addCollectionToMap: function(collection)
	{
		console.log('addCollectionToMap');
		console.log('collection');
		var self = this;
		var data = [];
		var maxVal = 0;
		var minVal = 0;
		var colorlow;
		var colorhigh;
		collection.each(function(model) {
			collectionId = model.attributes.collectionid;
			params = self.collections[collectionId].params;
			color = params.color;
			colorLow = params.colorLow;
			colorHigh = params.colorHigh;
			
			self.cleanPointModel(model);
			data.push(model.get('lat'));
			data.push(model.get('lon'));
			var val = model.get('val');
			/*if (val == 0) {
				val = Math.random() * .5;
			}*/
			if (val > maxVal) {
				maxVal = val;
			}
			data.push(val);
		});
		
		while(color.charAt(0) == '#')
		    color = color.substr(1);
			colorHigh = colorHigh.substr(1);
			colorLow = colorLow.substr(1);
		
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
				//console.log(data[i]);
			}
		}
		this.globe.addData(data, {
			format: 'magnitude', 
			name: collection.get('_id'), 
			animated: false,
			colorFn: function(val) {
				
				//var rainbow = new Rainbow();
				//rainbow.setSpectrum(colorlow, colorhigh);		
				//rainbow.setNumberRange(0, 1);
				
				var c = new THREE.Color();
				c.setHex("0x" + color);
				return c;
			}
		});
		this.globe.createPoints();

	},
	
	setViewport: function(result)
	{
		var first = result[0],
		    center = this.toWebMercator(first.geometry.location),
		    viewport = first.geometry.viewport,
		    viewportSW = viewport.getSouthWest(),
		    viewportNE = viewport.getNorthEast(),
		    min = this.toWebMercator(viewportSW),
		    max = this.toWebMercator(viewportNE);		
			//Do something here
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