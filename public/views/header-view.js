window.HeaderView = Backbone.View.extend({

    tagName: 'div',
	className: 'header-view',
	
    events: {
		'click #settingsButton': 'settingsButtonClicked',
		'click #aboutGeosense:' : 'aboutGeosenseClicked',
		'click #aboutSafecast:' : 'aboutSafecastClicked',
		'click #postFacebook:' : 'postFacebookClicked',
		'click #postTwitter:' : 'postTwitterClicked',
		'keypress input': 'keyEvent',
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('header'));
		this.vent = options.vent;	
		this.mapName = options.mapName;
		this.sidebarstate = "hidden";
    },

    render: function() {
		$(this.el).html(this.template());
		this.setTitle();
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
	
	setTitle: function() {
		this.$('.brand').html(this.mapName);;
	},

	settingsButtonClicked: function() {
				
		if(this.sidebarstate == 'hidden')
		{
			$('#settingsButton').html('<i class="icon-arrow-right icon-white"></i> Show Settings');
			$('.sidebar-view').addClass('visible');
			$('.map-view').addClass('full');
			$('.map-gl-view').addClass('full');
			$('.sidebar-view .black-overlay').addClass('visible');
			this.sidebarstate = '';
		}
		else
		{
			$('#settingsButton').html('<i class="icon-arrow-left icon-white"></i> Hide Settings');
			$('.sidebar-view').removeClass('visible');
			$('.map-view').removeClass('full');
			$('.map-gl-view').removeClass('full');
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
	
	postTwitterClicked: function() {
		var tweet = {};
		tweet.url = 'url';
		tweet.text = 'Check out the Safecast map: ' + window.location;
		tweet.via = "safecastdotorg";

		var url = 'https://twitter.com/share?' + $.param(tweet);

		window.open(url, 'Tweet this post', 'width=650,height=251,toolbar=0,scrollbars=0,status=0,resizable=0,location=0,menuBar=0');
	},
	
	postFacebookClicked: function() {
		var url = 'http://www.facebook.com/sharer.php?u='
		url += encodeURIComponent(window.location);
		url += '&t=Check out the Safecast map';
		window.open('' + url, 'Share it on Facebook', 'width=650,height=251,toolbar=0,scrollbars=0,status=0,resizable=0,location=0,menuBar=0');
	},
	
	remove: function() {
		$(window).unbind();
		$(this.el).remove();
		return this;
	},
  
});