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
		'click #scale_linear': 'scaleLinearClicked',
		'click #scale_log': 'scaleLogClicked',
		'click #tweetButton' : 'tweetButtonClicked',
		'click #deleteMap' : 'deleteMapClicked',
		'click #toggleCommentsVisible' : 'toggleCommentsVisibleClicked',
		'click #toggleCommentsHidden' : 'toggleCommentsHiddenClicked'
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('sidebar'));
		this.vent = options.vent;
		this.page = options.page;
		
		_.bindAll(this, "setToggleStates");
		options.vent.bind("setToggleStates", this.setToggleStates);	
    },

    render: function() {
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
					
        return this;
    },

	addDataToggle: function(options) {
		
		this.sideBarDataView = new SideBarDataView({vent: this.vent, url: options.url});
        this.$('#accordion').append(this.sideBarDataView.render({number: options.number}).el);
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
		app.navigate(_mapId + "/globe", {trigger: true});
	},
	
	addDataClicked: function() {
		
		if(this.addDataView)
			this.addDataView.remove();
			
		this.addDataView = new AddDataView({vent: this.vent});
        $('body').append(this.addDataView.render().el);
		$('#addDataModal').modal('toggle');
	},
	
	deleteMapClicked: function() {
		$.ajax({
			type: 'DELETE',
			url: '/api/map/' + _mapId,
			success: function() {
				console.log('deleted map: ' + _mapId);
				window.location = '../';
			},
			error: function() {
				console.error('failed to delete map: ' + _mapId);
			}
		});
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