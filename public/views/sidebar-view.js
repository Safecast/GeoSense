window.SideBarView = Backbone.View.extend({

    tagName: 'div',
	className: 'sidebar-view',
	
    events: {
		'click #light_theme': 'lightFilterClicked',
		'click #dark_theme': 'darkFilterClicked',
		'click #standard_theme': 'standardFilterClicked',
		'click #display2D': 'display2DClicked',
		'click #display3D': 'display3DClicked',
		'click #addData': 'addDataClicked',
		'click #addDataLibrary': 'addDataLibraryClicked',
		'click #scale_linear': 'scaleLinearClicked',
		'click #scale_log': 'scaleLogClicked',
		'click #tweetButton' : 'tweetButtonClicked',
		'click #toggleCommentsVisible' : 'toggleCommentsVisibleClicked',
		'click #toggleCommentsHidden' : 'toggleCommentsHiddenClicked',
		'click #settingsTab' : 'settingsTabClicked',
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('sidebar'));
		this.vent = options.vent;
		this.page = options.page;
		
		_.bindAll(this, "setToggleStates");
		options.vent.bind("setToggleStates", this.setToggleStates);	
		if (IS_AR || IS_TAGGED_GLOBE || IS_REMOTE_CONTROLLED) {
			new OblessdClient({vent: options.vent, taggedObjects: taggedObjects, track: true});
		}
    },

    render: function() {
		var self = this;

		$(this.el).html(this.template());		
		if(this.page == 'map')
		{
			this.$('#display2D').addClass('active');
			
		}
		else if (this.page =='map-gl')
		{
			this.$('#themeToggleGroup').hide();
			this.$('#display3D').addClass('active');
		}
		this.$('#scale_linear').addClass('active');

		if (!DEBUG || !IS_AR && !IS_TAGGED_GLOBE) {
			this.$('#arToggleGroup').remove();
		} else {
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
		}

		if(!_admin)
		{
			this.$('#dataManager').remove();
		}
					
        return this;
    },

	addDataToggle: function(options) {
		
		this.sideBarDataView = new SideBarDataView({vent: this.vent, url: options.url});
        this.$('#accordion').append(this.sideBarDataView.render({number: options.number}).el);
	},
	
	settingsTabClicked: function() {
		if(_settingsVisible)
		{
			$('#settingsTabText').html('SHOW');
			$('#settingsTab').addClass('hidden');
			$('.sidebar-view').addClass('visible');
			$('.map-gl-view').addClass('full');
			$('.sidebar-view .black-overlay').addClass('visible');
			$('.olControlPanZoomBar').css("margin-left",0);
			_settingsVisible = false;
		}
		else
		{
			$('#settingsTabText').html('HIDE');
			$('#settingsTab').removeClass('hidden');
			$('.sidebar-view').removeClass('visible');
			
			$('.olControlPanZoomBar').css("margin-left",300);
			
			$('.map-view').removeClass('full');
			
			$('.sidebar-view .black-overlay').removeClass('visible');
			_settingsVisible = true;
		}
		
		this.vent.trigger("redrawMap");
		
	},
	
	setToggleStates: function(options){
		var state = options.state;
				
		if(state == 'mapgl')
		{
			this.$('#display3D').addClass('active');
			this.$('#display2D').removeClass('active');
			this.$('#themeToggleGroup').fadeOut('fast');
			this.$('#scaleToggleGroup').fadeIn('fast');
		}
		else if (state == 'map')
		{
			this.$('#display3D').removeClass('active');
			this.$('#display2D').addClass('active');
			this.$('#themeToggleGroup').fadeIn('fast');
			this.$('#scaleToggleGroup').fadeOut('fast');
		}
	},
	
	addDataLibraryClicked: function() {
		this.toggleDataLibrary();
	},
	
	toggleDataLibrary: function(){
		
		if(_dataLibraryVisible == false)
		{
			this.dataLibraryView = new DataLibrary();
		    $(this.el).append(this.dataLibraryView.render().el);
			_dataLibraryVisible = true;
		}
		else
		{
			_dataLibraryVisible = false;
		}		
	},

	lightFilterClicked: function() {
		this.vent.trigger("updateMapStyle", 'light');
	},

	darkFilterClicked: function() {
		this.vent.trigger("updateMapStyle", 'dark');
	},
	
	standardFilterClicked: function() {
		this.vent.trigger("updateMapStyle", 'standard'); 
	},
	
	display2DClicked: function() {
		//Todo: Replace with proper routing
		app.navigate(_mapId + "/map", {trigger: true});
	},

	display3DClicked: function() {
		//Todo: Replace with proper routing
		if(!_admin)
		{
			app.navigate(_mapId + "/globe", {trigger: true});
		} else if(_admin)
		{
			app.navigate(_mapAdminId + "/globe", {trigger: true});
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