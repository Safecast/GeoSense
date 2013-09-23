define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/modal.html',
], function($, _, Backbone, config, utils, templateHtml) {
    "use strict";

	var ModalView = Backbone.View.extend({

	    tagName: 'div',
		className: 'modal fade',
		
	    events: {
	    },

	    initialize: function(options) {
		    this.template = _.template(templateHtml);
	    },

	    render: function() {
			this.$el.html(this.template())
				.attr('tabindex', -1)
				.modal({keyboard: true, show: false});
			return this;
	    },

		setTitle: function(string)
		{
			this.$('.modal-title').html(string);
		},
		
		setBody: function(string)
		{
			this.$('.modal-body').html(string);
		},
	  
	  	show: function() 
	  	{
	  		var self = this;
	        $(this.el).modal('show');
			$(this.el).on('hidden', function() {
				self.remove();
			});
	  	},

	    close: function()
	    {
			$(this.el).modal('hide');
	    },

	});

	return ModalView;
});
