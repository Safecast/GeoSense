define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/setup.html',
	'views/modal-view'
], function($, _, Backbone, config, utils, templateHtml, ModalView) {
	var SetupView = ModalView.extend({

	    tagName: 'div',
		className: 'setup-view modal fade',
		
	    events: {
			'click #deleteMapButton' : 'deleteMapClicked',
			'click #saveCloseButton' : 'saveClicked',
			
	    },

	    initialize: function(options) {
		    this.template = _.template(templateHtml);	
			this.vent = options.vent;
			this.mapInfo = options.mapInfo;
			this.mapInfoChanged = false;

			_.bindAll(this, "updateMapInfo");
		 	options.vent.bind("updateMapInfo", this.updateMapInfo);
	    },

	    updateMapInfo: function(mapInfo)
	    {
	    	var self = this;
			if (mapInfo) {
				this.mapInfo = mapInfo;
			}

			this.$('.map-name').html(this.mapInfo.title + ' Setup');
			this.mapInfoFields.each(function() {
				$(this).removeClass('error');
				var split = this.name.split('.');
				if (split.length == 2) {
					if (self.mapInfo[split[0]]) {
						$(this).val(self.mapInfo[split[0]][split[1]]);
					}
				} else {
					$(this).val(self.mapInfo[this.name]);
				}
			});

			this.$('.map-url').val(app.genPublicURL());
			this.$('.map-admin-url').val(app.genAdminURL());
	    },

	    render: function() 
	    {
	    	var self = this;

			$(this.el).html(this.template());	
			
			this.$(".map-url, .map-admin-url").click(function() {
			   $(this).select();
			});
			
			this.$(".enter-email").click(function() {
				$('#tab-setup-metadata').trigger('click');
				return false;
			});

			this.mapInfoFields = this.$('#setup-metadata input, #setup-metadata textarea, #setup-custom-domain input');

			this.mapInfoFields.each(function() {
				$(this).on('change keydown', function() {
					self.mapInfoChanged = true;
					self.$('#saveCloseButton').text(__('Save & close'));
				});
			});

			$(this.el).on('hidden', function() {
				app.navigate(app.genMapURI(null));
			});

			this.updateMapInfo();
			
	        return this;
	    },

		saveClicked: function() 
		{
			console.log('saveClicked', this.mapInfoChanged);
			if (!this.mapInfoChanged) {
				this.close();
				return false;
			}

			var postData = {};
			this.mapInfoFields.each(function() {
				postData[this.name] = $(this).val();
			});

			var self = this;
			this.$('#saveCloseButton').attr('disabled', true);
			$.ajax({
				type: 'POST',
				url: '/api/map/' + self.mapInfo._id,
				data: postData,
				success: function(data) {
					self.close();
					self.vent.trigger('updateMapInfo', data);
					self.$('#saveCloseButton').attr('disabled', false);
					self.mapInfoChanged = false;
				},
				error: function(jqXHR, textStatus, errorThrown) {
					var data = $.parseJSON(jqXHR.responseText);
					console.error('failed to update map: ' + self.mapInfo._id);
					if (data && data.errors) {
						self.mapInfoFields.removeClass('error');
						for (var k in data.errors) {
							$('[name="' + data.errors[k].path + '"]', this.mapInfoFields).addClass('error');
						}
						console.error('errors:', data.errors);
					}
					self.$('#saveCloseButton').attr('disabled', false);
				}
			});

			return false;
		},

		deleteMapClicked: function(e) {
			var self = this;
			if (window.confirm(__('Are you sure you want to delete this map? This action cannot be reversed!'))) {
				$.ajax({
					type: 'DELETE',
					url: '/api/map/' + self.mapInfo._id,
					success: function() {
						console.log('deleted map: ' + self.mapInfo._id);
						window.location = '/';
					},
					error: function(data) {
						console.error('failed to delete map: ' + self.mapInfo._id);
					}
				});
			}
			return false;
		},

	});

	return SetupView;
});
