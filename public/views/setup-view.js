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
		this.mapInfo = options.mapInfo;
    },

    render: function() {
		$(this.el).html(this.template());	
		this.$('.map-name').html(this.mapInfo.title + ' Setup');
		
		this.$('.map-url').val(BASE_URL + this.mapInfo.publicslug);
		this.$('.map-admin-url').val(BASE_URL + 'admin/' + this.mapInfo.adminslug);
		
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
		var self = this;
		if (window.confirm(__('Are you sure you want to delete this map? This action cannot be reversed!'))) {
			$.ajax({
				type: 'DELETE',
				url: '/api/map/' + self.mapInfo._id,
				success: function() {
					console.log('deleted map: ' + self.mapInfo._id);
					window.location = '/';
				},
				error: function() {
					console.error('failed to delete map: ' + self.mapInfo._id);
				}
			});
		}
	},

});