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
			'click #cancelButton' : 'cancelClicked',
			'click #savePositionButton': 'savePositionClicked',
			'click #saveViewOptionsButton': 'saveViewClicked'
	    },

	    initialize: function(options) 
	    {
		    this.template = _.template(templateHtml);	
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

			this.modelFieldInputs = this.$('#setup-metadata input, #setup-metadata textarea, #setup-custom-domain input');
			this.$('#cancelButton').hide();

			this.modelFieldInputs.each(function() {
				$(this).on('change keydown', function() {
					self.mapInfoChanged = true;
					self.$('#cancelButton').show();
					self.$('#saveCloseButton').text(__('Save and Close'));
				});
			});

			$(this.el).on('hidden', function() {
				app.navigate(app.genMapURI(null));
			});

			this.populateFromModel();
			
	        return this;
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

			this.model.save(postData, {
				success: function(model, response, options) {
					self.close();
					self.$('#saveCloseButton').attr('disabled', false);
					self.mapInfoChanged = false;
				},
				error: function(model, xhr, options) {
					var data = $.parseJSON(xhr.responseText);
					console.error('failed to update map: ' + self.model.id);
					if (data && data.errors) {
						self.modelFieldInputs.removeClass('error');
						for (var k in data.errors) {
							$('[name="' + data.errors[k].path + '"]', this.modelFieldInputs).addClass('error');
						}
						console.error('errors:', data.errors);
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
				viewOptions: this.getCurrentViewOptions()
			};

			var self = this;
			this.$('#saveViewOptionsButton').attr('disabled', true);

			this.model.save(postData, {
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
			this.populateFromModel();
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
						window.location = '/';
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

		getCurrentViewOptions: function()
		{
			return app.getCurrentViewOptions();
		},
		
	  	show: function() 
	  	{
			this.initialAreaChanged = !_.isEqual(this.model.attributes.initialArea, 
				this.getInitialMapArea());
			this.viewOptionsChanged = !_.isEqual(this.model.attributes.viewOptions, 
				this.getCurrentViewOptions());
			this.$('#savePositionButton').attr('disabled', !this.initialAreaChanged);
			this.$('#saveViewOptionsButton').attr('disabled', !this.viewOptionsChanged);
	  		SetupView.__super__.show.call(this);
	  	}

	});

	return SetupView;
});
