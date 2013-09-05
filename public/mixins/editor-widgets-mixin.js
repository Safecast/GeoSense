define([
	'jquery',
	'underscore',
	'backbone',
], function($, _, Backbone) {

	var EditorWidgetsMixin = {

	    initSliders: function() 
	    {
	    	var self = this,
	    		or = function(val1, val2) {
	    			return !isNaN(val1) ? val1 : val2
	    		};
			this.$('.slider').each(function() {
				var fieldName = $(this).attr('data-field'),
					min = or(parseFloat($(this).attr('data-min')), 0),
					max = or(parseFloat($(this).attr('data-max')), 1);
				$(this).slider({
					min: min,
					max: max,
					range: "min",
					step: (max == 1 ? .01 : 1),
					slide: function( event, ui ) {
						$(self.modelInputs[fieldName][0]).val(ui.value);
						$(self.modelInputs[fieldName][0]).trigger('change');
					}
			    });
			    $(self.modelInputs[fieldName][0]).change(function() {
			    	self.updateSliders();
			    });
				self.updateSlider(this);
			});
		},

		updateSlider: function(slider)
		{
			var fieldName = $(slider).attr('data-field');
			$(slider).slider('value', $(this.modelInputs[fieldName][0]).val());
		},

		updateSliders: function() 
		{
	    	var self = this;
			this.$('.slider').each(function() {
				self.updateSlider(this);
			});
		},

	    initColorPicker: function(input, val) 
	    {
	    	var self = this;
	    	if (val != undefined) {
				$(input).miniColors('value', val);	
	    	}
			$(input).miniColors({
			    change: function(hex, rgb) { 
					$(input).trigger('change');
				}
			});
	    },

	};

	return EditorWidgetsMixin;
});