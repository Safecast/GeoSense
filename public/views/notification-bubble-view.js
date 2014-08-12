define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'text!templates/notification-bubble.html',
], function($, _, Backbone, config, templateHtml) {
	"use strict";

	var levels = ['success', 'info', 'warn', 'error'],
		NotificationBubbleView = Backbone.View.extend({

		/*className: 'panel panel-default map-info',*/
		events: {
		},

		levels: levels,

		className: 'notification-bubble',

		initialize: function(options) 
		{    	
			this.template = _.template(templateHtml);
		},

		render: function()
		{
			$(this.el).html(this.template());
			return this;
		},

		setLevel: function(level)
		{
			var self = this;
			_.each(this.levels, function(l) {
				self.$el.toggleClass(l, level == l);
			});
			return this;
		},

		setMessage: function(message)
		{
			this.$('.message').text(message);
			return this;
		},

		appear: function(autoDisappear)
		{
			var self = this;
			this.$el.hide().fadeIn('fast', function() {
				if (autoDisappear || autoDisappear == undefined) {
					setTimeout(function() {
						self.disappear();
					}, NOTIFICATION_VISIBLE_TIME);
				}
			});
			return this;
		},

		disappear: function(autoDestroy)
		{
			var self = this;
			this.$el.fadeOut('fast', function() {
				if (autoDestroy || autoDestroy == undefined) {
					self.destroy();
				}
			});
			return this;
		},

		destroy: function()
		{
			this.remove();
			this.unbind();
		},

		notify: function(message, level)
		{
			this.render()
				.setLevel(level)
				.setMessage(message);
			$('body').append(this.appear().$el);
		},
	});

	// add static methods for each notification level
	_.each(levels, function(l) {
		NotificationBubbleView[l] = function(message) {
			new NotificationBubbleView().notify(message, l);
		};
	});

	return NotificationBubbleView;
});
