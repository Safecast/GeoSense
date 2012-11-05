window.PanelViewBase = Backbone.View.extend({

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

    render: function() {
    	console.log(this);
		$(this.el).html(this.template());
		var self = this;

		$(this.el).draggable({
			start: function() {
				//$(this).css('right', 'auto');
				$(this).css('bottom', 'auto');
			},
			stop: function() {
				var right = $(this).position().left + $(this).outerWidth();				
				if (right == $('.snap.right').position().left) {
					// re-dock to right edge
					$(this).css('left', 'auto');
				}
			},

			snap: ".snap, .panel", snapMode: "outer"
		});
		$(this.el).css('position', 'absolute'); // draggable sets it to relative

		this.$('a.extend').click(function() {
			$(self.el).toggleClass('extended');			
			if ($(self.el).is('.extended')) {
				self.setPanelState(true);
			}
			self.vent.trigger('dataInfoViewResized');
			return false;
		});

		this.$('a.collapse').click(function() {
			self.setPanelState();	
			return false;
		})

		this.$('a.close').click(function() {
			$(self.el).hide();
			return false;
		});

        return this;
    }

});	
