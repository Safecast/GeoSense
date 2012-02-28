window.SideBarView = Backbone.View.extend({

    tagName: 'div',
	className: 'sidebar-view',
	
    events: {
		'click #light_theme': 'lightFilterClicked',
		'click #dark_theme': 'darkFilterClicked',
		'click #standard_theme': 'standardFilterClicked',
    },

    initialize: function(options) {
	    
	    this.template = _.template(tpl.get('sidebar'));
		this.vent = options.vent;
    },

    render: function() {
		$(this.el).html(this.template());				
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

});