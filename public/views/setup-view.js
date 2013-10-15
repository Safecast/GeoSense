define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/setup.html',
	'views/modal-view'
], function($, _, Backbone, config, utils, templateHtml, ModalView) {
    "use strict";

	var SetupView = ModalView.extend({

	    tagName: 'div',
		className: 'setup-view modal fade',
		
	    events: {
			'click #deleteMapButton' : 'deleteMapClicked',
			'click #saveCloseButton' : 'saveClicked',
			'click #cancelButton' : 'cancelClicked',
			'click #savePositionButton': 'savePositionClicked',
			'click #saveViewOptionsButton': 'saveViewClicked',
			'click .sharing-toggle': 'sharingToggleClicked',
	    },

	    initialize: function(options) 
	    {
		    this.template = _.template(templateHtml);	
		    SetupView.__super__.initialize.apply(this, arguments);
			this.mapInfoChanged = false;
			this.initialAreaChanged = this.viewOptionsChanged = true;
			this.listenTo(this.model, 'sync', this.populateFromModel);
	    },

	    populateFromModel: function()
	    {
	    	var self = this,
	    		mapInfo = this.model.attributes;

			this.$('.map-name').html(mapInfo.title + ' Setup');
			this.modelFieldInputs.each(function() {
				$(this).removeClass('error');
				var split = this.name.split('.');
				if (split.length == 2) {
					if (mapInfo[split[0]]) {
						$(this).val(mapInfo[split[0]][split[1]]);
					}
				} else {
					$(this).val(mapInfo[this.name]);
				}
			});

			this.updateSharingToggles(this.model.attributes.sharing);
			this.$('.public-url').val(this.model.publicUrl({secret: false}));
			this.$('.secret-url').val(this.model.publicUrl({secret: true}));

			self.setMapInfoChanged(false);
	    },

	    updateSharingToggles: function(sharing)
	    {
	    	switch (sharing) {
	    		case SharingType.PRIVATE:
	    			this.$('.is-private').show();
	    			this.$('.is-public').hide();
	    			break;
	    		case SharingType.WORLD:
	    			this.$('.is-public').show();
	    			this.$('.is-private').hide();
	    			break;
	    	}
	    	this.$('.model-input[name=sharing]').val(sharing);
	    },

	    sharingToggleClicked: function(evt)
	    {
	    	this.updateSharingToggles($(evt.currentTarget).attr('data-value'));
	    	this.setMapInfoChanged(true);
	    	return false;
	    },

	    focusTab: function(sel)
	    {
			self.$(sel).trigger('click');
			// select first empty input
			var inputs = self.$('.tab-pane.active').find('input, textarea');
			for (var i = 0; i < inputs.length; i++) {
				if (!$(inputs[i]).val()) {
					$(inputs[i]).focus();
					return;
				}
			}
	    },

	    render: function() 
	    {
	    	var self = this;
	  		SetupView.__super__.render.call(this);
			
			this.$('.urls input').click(function() {
				$(this).select();
			});
			
			this.$(".enter-email").click(function() {
				self.focusEmail();
				return false;
			});

			this.modelFieldInputs = this.$('form.map-setup .model-input');

			this.modelFieldInputs.each(function() {
				$(this).on('change keydown', function() {
					self.setMapInfoChanged(true);
				});
			});
			this.$('#map-sharing button').on('click', function() {
				self.setMapInfoChanged(true);
			});

			$(this.el).on('hidden.bs.modal', function() {
				app.navigate(app.currentMapUri(null));
			});

			this.populateFromModel();
			
	        return this;
	    },

	    setMapInfoChanged: function(status)
	    {
	    	var self = this;
			self.mapInfoChanged = status;
			if (status) {
				self.$('#cancelButton').text(__('Cancel'));
			} else {
				self.$('#cancelButton').text(__('Close'));
			}
			self.$('#saveCloseButton').attr('disabled', !status);
			this.$('#saveCloseButton').attr('disabled', !status);
	    },

		saveClicked: function(event) 
		{
			if (!this.mapInfoChanged) {
				this.close();
				return false;
			}

			var postData = {};
			this.modelFieldInputs.each(function() {
				postData[this.name] = $(this).val();
			});

			var self = this;
			this.$('#saveCloseButton').attr('disabled', true);
			self.modelFieldInputs.removeClass('has-error');

			this.model.save(postData, {
				patch: true,
				success: function(model, response, options) {
					self.close();
					self.trigger('map:saved');
					self.setMapInfoChanged(false);
				},
				error: function(model, xhr, options) {
					var data = $.parseJSON(xhr.responseText);
					console.error('failed to update map: ' + self.model.id);
					if (data && data.errors) {
						_.each(data.errors, function(err) {
							var sel = 'input[name="' + err.path + '"]',
								input = self.$(sel);
							input.addClass('has-error');
							/*input.tooltip('destroy');
							input.tooltip({trigger: 'focus', title: err.message});
							input[0].focus();*/
						});
					}
					self.$('#saveCloseButton').attr('disabled', false);
				}
			});

			return false;
		},

		savePositionClicked: function(event) 
		{
			if (!this.initialAreaChanged) return;

			var postData = {
				initialArea: this.getInitialMapArea()
			};

			var self = this;
			this.$('#savePositionButton').attr('disabled', true);

			this.model.save(postData, {
				patch: true,
				success: function(model, response, options) {
					//self.$('#savePositionButton').attr('disabled', false);
				},
				error: function(model, xhr, options) {
					var data = $.parseJSON(xhr.responseText);
					console.error('failed to update map: ' + self.model.id);
					if (data && data.errors) {
						console.error('errors:', data.errors);
					}
					self.$('#savePositionButton').attr('disabled', false);
				}
			});

			return false;
		},

		saveViewClicked: function(event) 
		{
			if (!this.viewOptionsChanged) return;

			var postData = {
				viewOptions: app.getCurrentViewOptions()
			};

			var self = this;
			this.$('#saveViewOptionsButton').attr('disabled', true);

			this.model.save(postData, {
				patch: true,
				success: function(model, response, options) {
					//self.$('#saveViewOptionsButton').attr('disabled', false);
				},
				error: function(model, xhr, options) {
					var data = $.parseJSON(xhr.responseText);
					console.error('failed to update map: ' + self.model.id);
					if (data && data.errors) {
						console.error('errors:', data.errors);
					}
					self.$('#saveViewOptionsButton').attr('disabled', false);
				}
			});

			return false;
		},		

		cancelClicked: function(event) 
		{
			this.close();
			return false;
		},

		deleteMapClicked: function(event) 
		{
			var self = this,
				id = this.model.id;
			if (window.confirm(__('Are you sure you want to delete this map? This action cannot be reversed!'))) {
				this.model.destroy({
					success: function(model, response, options) {
						console.log('deleted map: ' + id);
						window.location = BASE_URL;
					},
					error: function(model, xhr, options) {
						console.error('failed to delete map: ' + id, xhr);
					}
				});
			}
			return false;
		},

		getInitialMapArea: function() 
		{
			var a = app.mapView.getVisibleMapArea();
			delete a.bounds;
			return a;	
		},

	  	show: function() 
	  	{
			this.populateFromModel();
			this.initialAreaChanged = app.mapView && !_.isEqual(this.model.attributes.initialArea, 
				this.getInitialMapArea());
			this.viewOptionsChanged = app.mapView && !_.isEqual(this.model.attributes.viewOptions, 
				app.getCurrentViewOptions());
			this.$('#savePositionButton').attr('disabled', !this.initialAreaChanged);
			this.$('#saveViewOptionsButton').attr('disabled', !this.viewOptionsChanged);
	  		SetupView.__super__.show.call(this);
	  	}

	});

	return SetupView;
});
