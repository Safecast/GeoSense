define([
	'jquery',
	'underscore',
	'backbone',
	'spin'
], function($, _, Backbone, Spinner) {

	var SpinnerMixin = {

	    showSpinner: function()
	    {
	    	if (!this.$spinner.is(':visible')) {
	    		this.$spinner.css({opacity: 0}).show();	
	    	}
			this.$spinner.stop().animate({opacity: 1}, 50);
			return this;
	    },

	    hideSpinner: function()
	    {
	    	var self = this;
			this.$spinner.stop().fadeOut(300, function() {
				//self.$spinner.hide();
			});
			return this;
	    },

	    initLargeSpinner: function(container, settings)
	    {
	    	return this.initSpinner(container, _.extend(
	    		{radius: 10, width: 10}, settings));
	    },

	    initSpinner: function(container, settings)
	    {
	    	var settings = _.extend({
	    		radius: 4,
	    		length: 0,
	    		width: 4,
	    		color: '#888',
	    		lines: 7,
	    		speed: 1.5
	    	}, settings);
			this.$spinner = $(new Spinner(settings).spin().el)
				.hide();
			$(container).append(this.$spinner);
			return this;
	    }

	};

	return SpinnerMixin;
});