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
	 	options.vent.bind("updateValueScale", this.updateValueScale);
		
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

    	if (DEBUG) {
			this.stats = new Stats();
			this.stats.domElement.style.position = 'absolute';
			this.stats.domElement.style.top = '0px';
			this.el.appendChild(this.stats.domElement);
    	}
		
		container = this.el;
	    this.globe = new DAT.Globe(container);


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

	addOneComment: function(model) {
		//If we want to add comments to globe
    },
  
});