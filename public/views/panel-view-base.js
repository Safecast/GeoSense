define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/homepage.html',
], function($, _, Backbone, config, utils, templateHtml) {
	var PanelViewBase = Backbone.View.extend({

	    tagName: 'div',

		setPanelState: function(expand) {
			var self = this;
			if (expand == null) {
				expand = $(self.el).is('.collapsed');
			} 

			if (!expand) {
				$(self.el).addClass('collapsed');
			} else {
				$(self.el).removeClass('collapsed');
			}

			if ($(self.el).is('.collapsed')) {
				self.$('.panel-body').hide('fast');
			} else {
				self.$('.panel-body').show('fast');
			}
		},

		setTitle: function(string)
		{
			this.$('h3').html(string);
		},

		snapToView: function(otherView, side, resetOther)
		{
			switch (side) {
				case 'right':
					this.$el.css('left', 
						otherView.$el.position().left + otherView.$el.outerWidth()
						+ 'px');
					break;
				case 'left':
					this.$el.css('right', 
						$(otherView.el.parentNode).innerWidth() - otherView.$el.position().left
						+ 'px');
					break;
			}
			if (resetOther) {
				this.$el.css('top', otherView.$el.position().top + 'px');
			}

			return this;
		},

		show: function(speed) 
		{
			return this.$el.show(speed);
		},

		hide: function(speed)
		{
			return this.$el.hide(speed);
		},

	    render: function() 
	    {
			$(this.el).html(this.template());
			var self = this;

			$(this.el).draggable({
				start: function() {
					//$(this).css('right', 'auto');
					$(this).css('bottom', 'auto');
				},
				handle: this.$('.panel-header'),
				stop: function() {
					var el = this,
						right = $(this).position().left + $(this).outerWidth();
					$('.snap.right').each(function() {
						if (right == $(this).position().left) {
							console.log(this, $(this).position());
							// re-dock to right edge
							$(el).css('left', 'auto');
						}
					});
				},

				snap: ".snap, .panel", snapMode: "outer"
			});
			$(this.el).css('position', 'absolute'); // draggable sets it to relative

			this.$('a.panel-extend').click(function() {
				$(self.el).toggleClass('extended');			
				if ($(self.el).is('.extended')) {
					self.setPanelState(true);
				}
				self.vent.trigger('dataInfoViewResized');
				return false;
			});

			this.$('a.panel-collapse').click(function() {
				self.setPanelState();	
				return false;
			})

			this.$('a.panel-close').click(function() {
				self.detach();
				return false;
			});

	        return this;
	    },

		detach: function() 
		{
			this.$el.detach();
		}

	});	

	return PanelViewBase;
});
