window.MapInfoView = window.PanelViewBase.extend({

	className: 'panel map-info',
	
    events: {
    },

    initialize: function(options) 
    {    	
	    this.template = _.template(tpl.get('map-info'));	
		this.vent = options.vent;

		_.bindAll(this, "updateMapInfo");
	 	options.vent.bind("updateMapInfo", this.updateMapInfo);

		this.mapInfo = options.mapInfo;
	},

	updateMapInfo: function(mapInfo)
	{
		if (mapInfo) {
			this.mapInfo = mapInfo;
		}

		var fields = ['title', 'description', 'author', 'url'];
		for (var i = fields.length - 1; i >= 0; i--) {
			var el = this.$('.' + fields[i]);
			var f = this.mapInfo[fields[i]];
			if (f && f != '') {
				el.html(f);
				el.show();		
			} else {
				el.hide();
			}
		}
	},

	render: function()
	{
		MapInfoView.__super__.render.call(this);

		this.updateMapInfo();

		return this;
	}
});