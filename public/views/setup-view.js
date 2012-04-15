window.SetupView = Backbone.View.extend({

    tagName: 'div',
	className: 'setup-view',
	
    events: {
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('setup'));	
		this.vent = options.vent;
		this.mapId = options.mapId
    },

    render: function() {
		$(this.el).html(this.template());	
		
		this.$('.map-url').val('http://geo.media.mit.edu/'+ this.mapId);
		
		
		
		this.$(".map-url").click(function() {
		   $(this).select();
		});
		
		this.$('#setupModal').modal('show')			
        return this;
    },

});