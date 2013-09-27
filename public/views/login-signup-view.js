define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'permissions',
	'views/modal-view'
], function($, _, Backbone, config, utils, permissions, ModalView) {
    "use strict";

	//var MapInfoView = PanelViewBase.extend({
	var LoginSignupView = ModalView.extend({

		className: 'modal fade login-signup',
	    events: {
	    	'click .modal-body a': 'linkClicked',
	    	'submit .modal-body form': 'formSubmitted'
	    },

	    initialize: function() 
	    {
	    	LoginSignupView.__super__.initialize.apply(this, arguments);
			this.startUrl = window.BASE_URL + 'signup';
	    },

	    showSignup: function()
	    {
			this.render().getPage(window.BASE_URL + 'signup');
			this.show();
	    },

	    showLogin: function()
	    {
			this.render().getPage(window.BASE_URL + 'login');
			this.show();
	    },

	    render: function() 
	    {
	    	var self = this;
	    	LoginSignupView.__super__.render.apply(this, arguments);
			this.$el.on('shown.bs.modal', function() {
				self.focusFirstInput();
			});
	    	return this;
	    },

	    getPage: function(url)
	    {
	    	var self = this;
	    	$.get(url, function(resp) {
	    		self.renderBody(resp);
	    	});
	    },

        focusFirstInput: function()
        {
            var $input = this.$('input');
            if ($input.length) {
                $input[0].focus();
            }
        },

	    renderBody: function(body)
	    {
	    	var $body = $(body);
	    	this.setTitle($body.find('h2').remove().text());
			this.$('.modal-body').html($body);
			this.focusFirstInput();
	    },

	    linkClicked: function(evt)
	    {
	    	this.getPage($(evt.currentTarget).attr('href'));
	    	return false;
	    },

	    formSubmitted: function(evt)
	    {
	    	var self = this,
	    		$form = $(evt.currentTarget),
	    		verb = $[$form.attr('method').toLowerCase()],
	    		data = {};
	    		this.$('.modal-body input').each(function() {
	    			data[$(this).attr('name')] = $(this).val();
	    		});

	    	verb($form.attr('action'), data, function(resp) {
	    		if (typeof resp == 'object' && resp._id) {
	    			permissions.setUser(resp);
	    			self.close();
	    			return;
	    		}
	    		self.renderBody(resp);
	    	});
	    	return false;
	    },

	});

	return LoginSignupView;
});
