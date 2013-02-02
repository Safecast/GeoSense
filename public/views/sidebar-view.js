define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/sidebar.html',
	'views/add-data-view',
	'views/data-library-view'
], function($, _, Backbone, config, utils, templateHtml, AddDataView, DataLibraryView) {
	var SideBarView = Backbone.View.extend({

	    tagName: 'div',
		className: 'sidebar-view',
		
	    events: {
			'click #addData': 'addDataClicked',
			'click #addDataLibrary': 'addDataLibraryClicked',
			'click #scale_linear': 'scaleLinearClicked',
			'click #scale_log': 'scaleLogClicked',
			'click #tweetButton' : 'tweetButtonClicked',
			'click #toggleCommentsVisible' : 'toggleCommentsVisibleClicked',
			'click #toggleCommentsHidden' : 'toggleCommentsHiddenClicked',
			'click #settingsTab' : 'settingsTabClicked',
			'click #savePosition' : 'savePositionClicked',
	    },

	    initialize: function(options) {
		    this.template = _.template(templateHtml);
			this.vent = options.vent;
			
			_.bindAll(this, "mapAreaChanged");
			options.vent.bind("mapAreaChanged", this.mapAreaChanged);  

			/*if (IS_AR || IS_LOUPE || IS_TAGGED_GLOBE) {
				new OblessdClient({vent: options.vent, taggedObjects: taggedObjects, track: true});
			}*/
	    },

	    mapAreaChanged: function(mapArea)
	    {
	    	this.enableSavePositionButton();
	    	this.initialArea = {
	    		center: mapArea.center,
	    		zoom: mapArea.zoom
	    	};
	    },

		enableSavePositionButton: function()
		{
			this.$('#savePosition').attr('disabled', false);
			this.$('#savePosition').removeClass('disabled');
		},
		
		disableSavePositionButton: function()
		{
			this.$('#savePosition').attr('disabled', true);
			this.$('#savePosition').addClass('disabled');
		},

		savePositionClicked: function()
		{
			//build json and update
			var self = this;
			//this.collection.unbindCollection();
					
			if (this.colorType == ColorType.SOLID) {
				this.colors = [{color: this.$('#colorInput').val()}];
			}
			
			var postData = {
				initialArea: this.initialArea
			};
			
			$.ajax({
				type: 'POST',
				url: '/api/map/' + app.mapInfo._id,
				dataType: 'json',
				data: postData,
				success: function(data) {
			    	self.disableSavePositionButton();
				},
				error: function() {
					console.error('failed to update map');
				}
			});	
				
		},

	    render: function() {
			var self = this;

			$(this.el).html(this.template());		
			this.$('#scale_linear').addClass('active');

			/*
			if (!DEBUG || (!IS_AR && !IS_LOUPE && !IS_TAGGED_GLOBE)) {
				this.$('#arToggleGroup').remove();
			} else {
				this.$("#world-fixed-dist-val").text(WORLD_FIXED_DIST);
				this.$('#world-fixed-dist').slider({
					value: WORLD_FIXED_DIST,
					min: 0,
					max: radius * 10,
					step: 1,
					range: 'max',
					slide: function( event, ui ) {
						self.$("#world-fixed-dist-val").text(ui.value);
						WORLD_FIXED_DIST = ui.value;
					},
				});
				this.$("#world-rot-x-val").text(WORLD_ROT_X);
				this.$('#world-rot-x').slider({
					value: WORLD_ROT_X,
					min: -Math.PI,
					max: Math.PI,
					step: Math.PI / 100,
					range: 'max',
					slide: function( event, ui ) {
						self.$("#world-rot-x-val").text(ui.value);
						WORLD_ROT_X = ui.value;
					},
				});
				this.$("#world-rot-y-val").text(WORLD_ROT_Y);
				this.$('#world-rot-y').slider({
					value: WORLD_ROT_Y,
					min: -Math.PI,
					max: Math.PI,
					step: Math.PI / 100,
					range: 'max',
					slide: function( event, ui ) {
						self.$("#world-rot-y-val").text(ui.value);
						WORLD_ROT_Y = ui.value;
					},
				});
				this.$("#world-rot-z-val").text(WORLD_ROT_Z);
				this.$('#world-rot-z').slider({
					value: WORLD_ROT_Z,
					min: -Math.PI,
					max: Math.PI,
					step: Math.PI / 100,
					range: 'max',
					slide: function( event, ui ) {
						self.$("#world-rot-z-val").text(ui.value);
						WORLD_ROT_Z = ui.value;
					},
				});

				this.$("#camera-fov-val").text(CAMERA_FOV);
				this.$('#camera-fov').slider({
					value: CAMERA_FOV,
					min: 1,
					max: 100,
					step: .25,
					range: 'max',
					slide: function( event, ui ) {
						self.$("#camera-fov-val").text(ui.value);
						CAMERA.fov = CAMERA_FOV = ui.value;
						CAMERA.updateProjectionMatrix();
					},
				});
				this.$("#virtual-physical-factor-val").text(VIRTUAL_PHYSICAL_FACTOR);
				this.$('#virtual-physical-factor').slider({
					value: VIRTUAL_PHYSICAL_FACTOR,
					min: .5,
					max: 1.5,
					step: .25,
					range: 'max',
					slide: function( event, ui ) {
						self.$("#virtual-physical-factor-val" ).text(ui.value);
						VIRTUAL_PHYSICAL_FACTOR = ui.value;
					},
				});

				this.$("#lens-ofs-x-val").text(taggedObjects[1].tags[0].rel.loc.x);
				this.$('#lens-ofs-x').slider({
					value: taggedObjects[1].tags[0].rel.loc.x,
					min: -200,
					max: 200,
					step: 1,
					range: 'max',
					slide: function( event, ui ) {
						self.$("#lens-ofs-x-val" ).text(ui.value);
						taggedObjects[1].tags[0].rel.loc.x = ui.value;
					},
				});

				this.$("#lens-ofs-y-val").text(taggedObjects[1].tags[0].rel.loc.y);
				this.$('#lens-ofs-y').slider({
					value: taggedObjects[1].tags[0].rel.loc.y,
					min: -200,
					max: 200,
					step: 1,
					range: 'max',
					slide: function( event, ui ) {
						self.$("#lens-ofs-y-val" ).text(ui.value);
						taggedObjects[1].tags[0].rel.loc.y = ui.value;
					},
				});

				this.$("#lens-ofs-z-val").text(taggedObjects[1].tags[0].rel.loc.z);
				this.$('#lens-ofs-z').slider({
					value: taggedObjects[1].tags[0].rel.loc.z,
					min: -200,
					max: 200,
					step: 1,
					range: 'max',
					slide: function( event, ui ) {
						self.$("#lens-ofs-z-val" ).text(ui.value);
						taggedObjects[1].tags[0].rel.loc.z = ui.value;
					},
				});
			}*/

			if (!app.isMapAdmin()) {
				this.$('#dataManager').remove();
			}

			this.updateAppLayout();
						
	        return this;
	    },

		settingsTabClicked: function() {
			app.settingsVisible = !app.settingsVisible;
			this.vent.trigger("redrawMap");
			this.updateAppLayout();
		},

		updateAppLayout: function() 
		{
			if (!app.settingsVisible) {
				$('#settingsTabText').html('SHOW');
				$('#settingsTab').addClass('hidden');
				$('.sidebar-view').addClass('visible');
				$('.sidebar-view .black-overlay').addClass('visible');
				$('#app').removeClass('sidebar-visible');
				$('.map-view').removeClass('full');
			} else {
				$('#settingsTabText').html('HIDE');
				$('#settingsTab').removeClass('hidden');
				$('.sidebar-view').removeClass('visible');
				$('.sidebar-view .black-overlay').removeClass('visible');
				$('#app').addClass('sidebar-visible');
				$('.map-view').addClass('full');
				app.settingsVisible = true;
			}
		},
		
		addDataLibraryClicked: function() {
			this.toggleDataLibrary();
		},
		
		toggleDataLibrary: function(){
			
			if(app.dataLibraryVisible == false)
			{
				this.dataLibraryView = new DataLibraryView();
			    $(this.el).append(this.dataLibraryView.render().el);
				app.dataLibraryVisible = true;
			}
			else
			{
				app.dataLibraryVisible = false;
			}		
		},

		addDataClicked: function() {
			
			if(this.addDataView)
				this.addDataView.remove();
				
			this.addDataView = new AddDataView({vent: this.vent});
	        $('body').append(this.addDataView.render().el);
			$('#addDataModal').modal('toggle');
		},

		scaleLinearClicked: function() {
			this.vent.trigger("updateValueScale", 'linear'); 
		},

		scaleLogClicked: function() {
			this.vent.trigger("updateValueScale", 'log'); 
		},
		
		tweetButtonClicked: function() {
			var tweets = new TweetCollection({});
		},
		
		toggleCommentsVisibleClicked: function()
		{
			this.toggleCommentVisibility(1);
		},
		
		toggleCommentsHiddenClicked: function()
		{
			this.toggleCommentVisibility(0)
		},
		
		toggleCommentVisibility: function(type)
		{
			this.vent.trigger("toggleLayerVisibility", null, type, 'comments');
		},
		
		addOne: function(comment) {
			var self = this;
	    },

	    addAll: function() {
	      var self = this;
			this.collection.each(function(comment){ 
			self.addOne(comment);
		 	});
	    },

		remove: function() {
			$(window).unbind();
			$(this.el).remove();
			return this;
		},
	});

	return SideBarView;
});
