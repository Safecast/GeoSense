window.SetupView = Backbone.View.extend({

    tagName: 'div',
	className: 'setup-view',
	
    events: {
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('setup'));	
		this.vent = options.vent;
		this.mapId = options.mapId
		this.mapAdminId = options.mapAdminId;
		this.mapName = options.mapName;
    },

    render: function() {
		$(this.el).html(this.template());	
		this.$('.map-name').html('Your map: ' + this.mapName);
		
		this.$('.map-url').val('http://geo.media.mit.edu/'+ this.mapId);
		this.$('.map-admin-url').val('http://geo.media.mit.edu/'+ this.mapAdminId);
		
		this.$(".map-url").click(function() {
		   $(this).select();
		});
		
		this.$(".map-admin-url").click(function() {
		   $(this).select();
		});
		
        return this;
    },

});