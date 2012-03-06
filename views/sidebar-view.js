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
    },

    initialize: function(options) {
	    
	    this.template = _.template(tpl.get('sidebar'));
		this.vent = options.vent;
		this.page = options.page;
		
    },

    render: function() {
		$(this.el).html(this.template());	
		
		if(this.page == 'map')
		{
			this.$('#display2D').addClass('active');
		}
		else if (this.page =='mapgl')
		{
			this.$('#display3D').addClass('active');
		}
					
        return this;
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
		app.navigate("", {trigger: true});
		//Todo: Replace with proper routing
		window.location.href = '';
	},

	display3DClicked: function() {
		app.navigate("globe", {trigger: true});
		//Todo: Replace with proper routing
		window.location.href = '/#globe';
	},
	addDataClicked: function() {
		console.log('adddata');
	},

});