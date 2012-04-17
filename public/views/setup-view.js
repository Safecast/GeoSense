window.SetupView = Backbone.View.extend({

    tagName: 'div',
	className: 'setup-view',
	
    events: {
		'click #deleteMapButton' : 'deleteMapClicked',
		'click #saveCloseButton' : 'saveClicked',
		
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
		this.$('.map-name').html(this.mapName + ' admin');
		
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

	saveClicked: function() {
		console.log('save');
		$('#setupModal').modal('hide')
	},

	deleteMapClicked: function() {
		console.log('hi');
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

});