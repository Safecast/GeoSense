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
		
		console.log('this.page : ' + this.page);
		
		if(this.page == 'map')
		{
			this.$('#display2D').addClass('active');
			
		}
		else if (this.page =='map-gl')
		{
			this.$('#themeToggleGroup').hide();
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
		//Todo: Replace with proper routing
		app.navigate("", {trigger: false});
		window.location.href = '';
	},

	display3DClicked: function() {
		//Todo: Replace with proper routing
		app.navigate("globe", {trigger: false});
		window.location.href = '/#globe';
	},
	addDataClicked: function() {
		this.addDataView = new AddDataView();
        $('body').append(this.addDataView.render().el);
		$('#myModal').modal('toggle');
		
		app.addData('safecast');
	},

});