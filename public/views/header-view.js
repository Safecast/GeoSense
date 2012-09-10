window.HeaderView = Backbone.View.extend({

    tagName: 'div',
	className: 'header-view',
	
    events: {
		'click #aboutMap': 'aboutMapClicked',
		'click #aboutGeoSense:' : 'aboutGeoSenseClicked',
		'click #shareLink:' : 'shareLinkClicked',
		'click #postFacebook:' : 'postFacebookClicked',
		'click #postTwitter:' : 'postTwitterClicked',
		'click #setupButton' : 'setupButtonClicked',
		'click #graphButton' : 'graphButtonClicked',
		'click #mapView a' : 'mapViewToggleClicked',
		'click #mapStyle .dropdown-menu a' : 'mapStyleToggleClicked',
		
		'keypress input': 'keyEvent',
    },

    initialize: function(options) 
    {
	    this.template = _.template(tpl.get('header'));
		this.vent = options.vent;	
		this.mapInfo = options.mapInfo;
		
		_.bindAll(this, "setStateType");
		this.vent.bind("setStateType", this.setStateType);

		_.bindAll(this, "updateMapInfo");
	 	options.vent.bind("updateMapInfo", this.updateMapInfo);
    },

    render: function() 
    {
		$(this.el).html(this.template());
		this.updateMapInfo();
		
		if (!app.isMapAdmin())
		{
			this.$('#setupButton').remove();
			this.$('#graphButton').css("right",270);
		}
		
        return this;
    },

	keyEvent: function(event) 
	{		
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
		this.$('.brand').attr('href', app.genPublicURL());
		this.$('.brand').click(function() {
			app.mapView.setVisibleMapArea(app.getDefaultVisibleMapArea());
			return false;
		});
		this.$('.brand').html('<h1>GeoSense</h1><h3>' + this.mapInfo.title + '</h3>');
	},

	mapViewToggleClicked: function(evt)
	{
		var link = evt.currentTarget;
		var mapViewName = link.href.split('#')[1];
		if (mapViewName != app.mapViewName) {
			app.navigate(app.genMapURI(mapViewName), {trigger: true});
		}
		evt.preventDefault();
	},

	mapStyleToggleClicked: function(evt)
	{
		var link = evt.currentTarget;
		var style = link.href.split('#')[1];
		app.setMapStyle(style);
		evt.preventDefault();
	},
	
	graphButtonClicked: function(evt) 
	{
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
		evt.preventDefault();
	},
	
	setupButtonClicked: function(evt) 
	{
		app.showSetupView();
		evt.preventDefault();
	},
	
	aboutGeoSenseClicked: function(evt) 
	{	
		app.showAbout();
		evt.preventDefault();
	},
	
	aboutMapClicked: function(evt) 
	{
		app.showMapInfo();
		evt.preventDefault();
	},
	
	shareLinkClicked: function(evt)
	{
		app.showShareLink();
		evt.preventDefault();
	},

	postTwitterClicked: function(evt) 
	{
		var tweet = {};
		var url = app.genPublicURL(true);
		tweet.url = url;
		tweet.text = __('Check out the %(title)s map:', {
			url: url,
			title: this.mapInfo.title
		});
		if (this.mapInfo.twitter) {
			tweet.via = this.mapInfo.twitter;
		}

		var url = 'https://twitter.com/share?' + $.param(tweet);
		window.open(url, __('Tweet this post'), 'width=650,height=251,toolbar=0,scrollbars=0,status=0,resizable=0,location=0,menuBar=0');
		evt.preventDefault();
	},
	
	postFacebookClicked: function(evt) 
	{
		var url = 'http://www.facebook.com/sharer.php?u='
		url += encodeURIComponent(app.genPublicURL(true));
		url += '&t=' +encodeURIComponent(__('Check out the %(title)s map', {
			title: this.mapInfo.title
		}));
		window.open('' + url, __('Share it on Facebook'), 'width=650,height=251,toolbar=0,scrollbars=0,status=0,resizable=0,location=0,menuBar=0');
		evt.preventDefault();
	},
	
	setStateType: function(type, pointCollectionId) 
	{	
		var stateIndicator = this.$('#stateIndicator');
		var message = this.$('#stateIndicatorMessage');
		
		/*switch(type)
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
		}*/
	},
	
	remove: function() 
	{
		$(window).unbind();
		$(this.el).remove();
		return this;
	},
  
});