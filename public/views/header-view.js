window.HeaderView = Backbone.View.extend({

    tagName: 'div',
	className: 'header-view',
	
    events: {
		'click #settingsButton': 'settingsButtonClicked',
		'click #aboutMap': 'aboutMapClicked',
		'click #aboutGeoSense:' : 'aboutGeoSenseClicked',
		'click #postFacebook:' : 'postFacebookClicked',
		'click #postTwitter:' : 'postTwitterClicked',
		'click #setupButton' : 'setupButtonClicked',
		'click #graphButton' : 'graphButtonClicked',
		
		'keypress input': 'keyEvent',
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('header'));
		this.vent = options.vent;	
		this.mapInfo = options.mapInfo;
		
		_.bindAll(this, "setStateType");
		this.vent.bind("setStateType", this.setStateType);

		_.bindAll(this, "updateMapInfo");
	 	options.vent.bind("updateMapInfo", this.updateMapInfo);
    },

    render: function() {
		$(this.el).html(this.template());
		this.updateMapInfo();
		this.settingsButtonClicked();
		
		if (!app.isMapAdmin())
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
				if (addr != '') {
					this.vent.trigger("geocodeAndSetMapLocation", addr);
				}
			}
		}
	},
	
	updateMapInfo: function(mapInfo) 
	{
		if (mapInfo) {
			this.mapInfo = mapInfo;
		}
		this.$('.brand').html('<h1>GeoSense</h1><h3>' + this.mapInfo.title + '</h3>');
	},

	settingsButtonClicked: function() {
				
		if(app.settingsVisible)
		{
			$('#settingsButton').html('<i class="icon-arrow-right icon-white"></i> Show Settings');
			$('.sidebar-view').addClass('visible');
			$('.map-view').addClass('full');
			$('.map-gl-view').addClass('full');
			$('.sidebar-view .black-overlay').addClass('visible');
			app.settingsVisible = false;
		}
		else
		{
			$('#settingsButton').html('<i class="icon-arrow-left icon-white"></i> Hide Settings');
			$('.sidebar-view').removeClass('visible');
			$('.map-view').removeClass('full');
			$('.map-gl-view').removeClass('full');
			$('.sidebar-view .black-overlay').removeClass('visible');
			app.settingsVisible = true;
		}	
	},
	
	graphButtonClicked: function() {
				
		if(app.graphVisible == true)
		{
			app.graphVisible = false;
			
			$('.graph-view').removeClass('visible');
			$('.header-view .graph').removeClass('active');
		}
		else
		{
			app.graphVisible = true;
			
			$('.graph-view').addClass('visible');
			$('.header-view .graph').addClass('active');
			this.vent.trigger("drawGraph"); 
		}
	},
	
	setupButtonClicked: function() {
		$('#setupModal').modal('show');	
	},
	
	aboutGeoSenseClicked: function() {
		
		this.modalView = new ModalView();
        $('body').append(this.modalView.render().el);
		this.modalView.setTitle('About GeoSense');
		this.modalView.setBody('GeoSense is an open publishing platform for visualization, social sharing, and data analysis of geospatial data. It explores the power of data analysis through robust layering and highly customizable data visualization. GeoSense supports the simultaneous comparison and individual styling for multiple massive data sources ranging from 10 thousand to 10 million geolocated points. It was developed by Anthony DeVincenzi and Samuel Luescher of the MIT Media Lab, alongside Hiroshi Ishii and Safecast.org.');
		$('#myModal').modal('toggle');
	},
	
	aboutMapClicked: function() {
		app.showMapInfo();
	},
	
	postTwitterClicked: function() {
		var tweet = {};
		var url = app.genPublicURL();
		tweet.url = url;
		tweet.text = __('Check out the %(title)s map: %(url)s', {
			url: url,
			title: this.mapInfo.title
		});
		if (this.mapInfo.twitter) {
			tweet.via = this.mapInfo.twitter;
		}

		var url = 'https://twitter.com/share?' + $.param(tweet);

		window.open(url, __('Tweet this post'), 'width=650,height=251,toolbar=0,scrollbars=0,status=0,resizable=0,location=0,menuBar=0');
	},
	
	postFacebookClicked: function() {
		var url = 'http://www.facebook.com/sharer.php?u='
		url += encodeURIComponent(app.genPublicURL());
		url += '&t=' +encodeURIComponent(__('Check out the %(title)s map', {
			title: this.mapInfo.title
		}));
		window.open('' + url, __('Share it on Facebook'), 'width=650,height=251,toolbar=0,scrollbars=0,status=0,resizable=0,location=0,menuBar=0');
	},
	
	setStateType: function(type, obj) {
		
		var stateIndicator = this.$('#stateIndicator');
		var message = this.$('#stateIndicatorMessage');
		
		switch(type)
		{
			case 'drawing':
			  	stateIndicator.stop(true, true).fadeIn('fast');
				message.html('DRAWING DATA SET');
			  	break;
			case 'parsing':
			  	stateIndicator.stop(true, true).fadeIn('fast');
				var progress;
				if (obj && obj.status == DataStatus.IMPORTING && obj.progress) {
					//progress = obj.progress - obj.progress % 1000;
					progress = formatLargeNumber(obj.progress);
				}
				if (progress) {
					var progressElement = $('.importProgress', message);
					if (!progressElement.length) {
						message.html('CRUNCHING DATA <span class="importProgress">' + progress + '</span>');
						progressElement = $('.importProgress', message);
					} else {
						progressElement.html(progress);
					}
					progressElement.updateFeedback();
				} else {
					message.html('CRUNCHING DATA');
				}
			  	break;
			case 'complete':
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