window.HeaderView = Backbone.View.extend({

    tagName: 'div',
	className: 'header-view',
	
    events: {
		'click #settingsButton': 'settingsButtonClicked',
		'click #aboutGeosense:' : 'aboutGeosenseClicked',
		'click #aboutSafecast:' : 'aboutSafecastClicked',
		'keypress input': 'keyEvent',
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('header'));
		this.vent = options.vent;
		
		this.sidebarstate = "hidden"
    },

    render: function() {
		$(this.el).html(this.template());
        return this;
    },

	keyEvent: function(event) {
		
		if (event.keyCode == 13) {
			if (this.$("#search'").is(":focus")) {
				var addr = $('#search').val();
				this.vent.trigger("setMapLocation", addr);
			}
		}
	},

	settingsButtonClicked: function() {
				
		if(this.sidebarstate == 'hidden')
		{
			$('#settingsButton').html('<i class="icon-arrow-right icon-white"></i> Show Settings');
			$('.sidebar-view').addClass('visible');
			$('.map-view').addClass('full');
			$('.sidebar-view .black-overlay').addClass('visible');
			this.sidebarstate = '';
		}
		else
		{
			$('#settingsButton').html('<i class="icon-arrow-left icon-white"></i> Hide Settings');
			$('.sidebar-view').removeClass('visible');
			$('.map-view').removeClass('full');
			$('.sidebar-view .black-overlay').removeClass('visible');
			this.sidebarstate = 'hidden';
		}	
	},
	
	aboutGeosenseClicked: function() {
		
		this.modalView = new ModalView();
        $('body').append(this.modalView.render().el);
		this.modalView.setTitle('About GeoSense');
		this.modalView.setBody('Body copy goes here!');
		$('#myModal').modal('toggle');
	},
	
	aboutSafecastClicked: function() {
		
		this.modalView = new ModalView();
        $('body').append(this.modalView.render().el);
		this.modalView.setTitle('About Safecast');
		this.modalView.setBody('Body copy goes here!');
		$('#myModal').modal('toggle');
	},
  
});