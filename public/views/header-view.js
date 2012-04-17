window.HeaderView = Backbone.View.extend({

    tagName: 'div',
	className: 'header-view',
	
    events: {
		'click #settingsButton': 'settingsButtonClicked',
		'click #aboutGeosense:' : 'aboutGeosenseClicked',
		'click #aboutSafecast:' : 'aboutSafecastClicked',
		'click #postFacebook:' : 'postFacebookClicked',
		'click #postTwitter:' : 'postTwitterClicked',
		'click #setupButton' : 'setupButtonClicked',
		'click #graphButton' : 'graphButtonClicked',
		
		'keypress input': 'keyEvent',
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('header'));
		this.vent = options.vent;	
		this.mapName = options.mapName;
		
		_.bindAll(this, "setStateType");
		this.vent.bind("setStateType", this.setStateType);
    },

    render: function() {
		$(this.el).html(this.template());
		this.setTitle();
		this.settingsButtonClicked();
		
		if(!_admin)
		{
			this.$('#setupButton').remove();
			this.$('#graphButton').css("right",270);
		}
		
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
		this.$('.brand').html('<h1>GEOKIT</h1><h3>'+this.mapName+'</h3>');
	},

	settingsButtonClicked: function() {
				
		if(_settingsVisible)
		{
			$('#settingsButton').html('<i class="icon-arrow-right icon-white"></i> Show Settings');
			$('.sidebar-view').addClass('visible');
			$('.map-view').addClass('full');
			$('.map-gl-view').addClass('full');
			$('.sidebar-view .black-overlay').addClass('visible');
			_settingsVisible = false;
		}
		else
		{
			$('#settingsButton').html('<i class="icon-arrow-left icon-white"></i> Hide Settings');
			$('.sidebar-view').removeClass('visible');
			$('.map-view').removeClass('full');
			$('.map-gl-view').removeClass('full');
			$('.sidebar-view .black-overlay').removeClass('visible');
			_settingsVisible = true;
		}	
	},
	
	graphButtonClicked: function() {
		
		console.log(_graphVisible);
		
		if(_graphVisible == true)
		{
			_graphVisible = false;
			
			$('.graph-view').removeClass('visible');
			$('.header-view .graph').removeClass('active');
		}
		else
		{
			_graphVisible = true;
			
			$('.graph-view').addClass('visible');
			$('.header-view .graph').addClass('active');
			this.vent.trigger("drawGraph"); 
		}
	},
	
	setupButtonClicked: function() {
		$('#setupModal').modal('show');	
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
	
	setStateType: function(type) {
		//console.log(type);
		
		var stateIndicator = this.$('#stateIndicator');
		var message = this.$('#stateIndicatorMessage');
		
		switch(type)
		{
			case 'drawing':
			  	stateIndicator.stop(true, true).fadeIn('fast');
				message.html('DRAWING DATA SET');
			  	break;
			case 'complete':
				console.log(_num_data_sources +" : "+ _loaded_data_sources)
			  	stateIndicator.delay(1000).fadeOut('fast');
			  	break;
			case 'loading':
		  		stateIndicator.stop(true, true).fadeIn('fast');
				stateIndicator.fadeIn('fast');
				message.html('LOADING DATA SET');
				break
			case 'loadingcomplete':
				break;
			case 'post':
				stateIndicator.stop(true, true).fadeIn('fast');
				stateIndicator.fadeIn('fast');
				message.html('UPLOADING NEW DATA');
				break;
			default:
		  		//
		}
	},
	
	remove: function() {
		$(window).unbind();
		$(this.el).remove();
		return this;
	},
  
});