define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/homepage.html',
], function($, _, Backbone, config, utils, templateHtml) {
    "use strict";

	var PanelViewBase = Backbone.View.extend({

	    className: 'panel panel-default',
	    draggable: true,
	    subViewContainer: '.panel-body',
	    showEffect: 'fadeIn',
	    hideEffect: 'fadeOut',

	    initialize: function(options) 
	    {
	    	var options = options || {};
		    this.vent = options.vent;
		},

		updatePanelState: function(expand) 
		{
			var self = this;
			if (expand == null) {
				expand = $(self.el).is('.collapsed');
			} 

			self.$el.toggleClass('collapsed', !expand);

			if (self.$el.is('.collapsed')) {
				self.$('.panel-body').slideUp('fast');
				self.$('.panel-footer').slideUp('fast');
			} else {
				self.$('.panel-body').slideDown('fast');
				self.$('.panel-footer').slideDown('fast');
			}

			return this;
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

		isVisible: function()
		{
			return this.$el.is(':visible');
		},

		isDraggable: function() 
		{
			return this.draggable == undefined ? this.$el.is('.panel-draggable') : this.draggable;
		},

		show: function(duration, complete) 
		{
			this.trigger('panel:show', this);
			if (!duration) {
				this.$el.show();
				return this;
			}
			if (this.$el.is('.panel-stick-left')) {
				this.$el.hide().toggle('slide', duration, complete);
				return this;
			}
			this.$el[this.showEffect](duration, complete);
			return this;
		},

		hide: function(duration, complete)
		{
			this.trigger('panel:hide', this);
			if (!duration) {
				this.$el.hide();
				return this;
			}
			if (this.$el.is('.panel-stick-left')) {
				this.$el.show().toggle('slide', duration, complete);
				return this;
			}
			this.$el[this.hideEffect](duration, complete);
			return this;
		},

		close: function(duration, complete)
		{
			var self = this;
			this.trigger('panel:close', self);
			this.hide('fast', function() {
				self.detach();
				if (complete) {
					complete();
				}
			})
		},

		attachTo: function(parentElement)
		{
			$(parentElement).append(this.el);
			if (this.isDraggable()) {
				this.$el.draggable('option', 'containment', parentElement);
			}
            if (this.$el.is('.panel-center')) {
                this.$el.css({
                	left: Math.max(15, $(parentElement).innerWidth() / 2 - this.$el.outerWidth() / 2) + 'px',
                	top: Math.max(15, $(parentElement).innerHeight() / 2 - this.$el.outerHeight() / 2 * 1.5) + 'px'
                });
            }
			this.isAttached = true;
			return this;
		},

	    render: function() 
	    {
			this.$el.html(this.template());
			var self = this;

			if (this.isDraggable()) {
				var handle = this.$('.panel-heading');
				handle.addClass('drag-handle');
				this.$el.addClass('panel-draggable');
				this.$el.draggable({
					start: function() {
						//$(this).css('right', 'auto');
						$(this).css('bottom', 'auto');
					},
					drag: function() {
						// TODO: implement proper panel management
						/*if ($(this).position().left != 0) {
							$(this).removeClass('panel-stick-left');
							$(this).css('top', '11px');
						}*/
					},
					handle: handle,
					stop: function() {
						var el = this,
							right = $(this).position().left + $(this).outerWidth();
						
						// TODO: implement proper panel management
						/*if ($(this).position().left == 0) {
							$(this).addClass('panel-stick-left');
							$(el).css('left', '');
							$(el).css('right', '');
							$(el).css('top', '');
							$(el).css('bottom', '');
						}*/

						$('.snap.right').each(function() {
							if (right == $(this).position().left) {
								//console.log(this, $(this).position());
								// re-dock to right edge
								$(el).css('left', '');
							}
						});
					},

					snap: ".snap, .panel", snapMode: "outer",
					snapTolerance: 10
				});
				this.$el.css('position', 'absolute'); // draggable sets it to relative
			}
			
			this.$('.panel-extend').click(function() {
				$(self.el).toggleClass('extended');			
				if ($(self.el).is('.extended')) {
					self.updatePanelState(true);
				}
				self.trigger('panel:resize', self);
			});

			this.$('.panel-collapse').click(function() {
				self.updatePanelState();
			})

			this.$('.panel-close').click(function() {
				self.close('fast');
			});

	        return this;
	    },

		detach: function() 
		{
			this.isAttached = false;
			this.$el.detach();
		},

		getContainer: function(container)
		{
			return this.$(container || this.subViewContainer);
		},

		appendSubView: function(view, container)
		{
			this.getContainer(container).append(view.el);
			if (view.setSuperView) {
				view.setSuperView(this);
			}
		}		

	});	

	return PanelViewBase;
});
