define([
	'jquery',
	'underscore',
	'backbone',
], function($, _, Backbone) {

	var ModelEditorMixin = {

		initModelInputs: function() 
		{
			var self = this;
			this.modelInputs = {};
			this.$('.model-input').each(function() {
				var name = $(this).attr('data-name') || $(this).attr('name');
				if (!self.modelInputs[name]) {
					self.modelInputs[name] = [];
				}
				self.modelInputs[name].push(this);
			});
		},

		populateModelInputs: function() 
		{
			this.savedAttributes = _.extend({}, this.model.attributes);
			this.savedModelAttributes = _.deepClone(this.model.attributes);
			for (var name in this.modelInputs) {
				var val = this.model.get(name);
				this.populateModelInput(name, val);
			}
			this.isChanged = false;
		},

		populateModelInput: function(name, val) 
		{
			var self = this;
			$(self.modelInputs[name]).each(function() {
				if ($(this).is('.btn-group')) {
			    	self.$('.btn', this).each(function() {
				    	if ($(this).val() != val) {
					    	$(this).removeClass('active');
				    	} else {
					    	$(this).addClass('active');
				    	}
			    	});
				} else if ($(this).is('input[type=checkbox], input[type=radio]')) {
					$(this).attr('checked', val == true);
				} else {
					$(this).val(val);
				}
			})
		},

		getValueFromModelInput: function(name)
		{
			var from = $(this.modelInputs[name][0]),
				val;
			if ($(from).is('input[type=checkbox], input[type=radio]')) {
				val = from.is(':checked');
			} else {
				val = from.val();
			}
			return val;
		},

		updateModelFromInputs: function(options)
		{
			var values = {};
			for (var name in this.modelInputs) {
				values[name] = this.getValueFromModelInput(name);
			}

			// this method may be defined by the view that inherits from the mixin
			if (this.getModelInputValues) {
				values = this.getModelInputValues(values);
			}

			this.model.set(values, options || {});
		},

		handleValidationErrors: function(xhr) 
		{
			// TODO: handleValidationErrors
			var data = $.parseJSON(xhr.responseText);
			if (data && data.errors) {
				console.error('errors:', data.errors);
			}
		},

	};

	return ModelEditorMixin;
});