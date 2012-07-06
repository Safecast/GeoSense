//window.MapInfoView = window.PanelViewBase.extend({
window.MapInfoView = window.ModalView.extend({

	/*className: 'panel map-info',*/
	templateName: 'map-info-modal',
	
    events: {
    },

    initialize: function(options) 
    {    	
    	MapInfoView.__super__.initialize.call(this, options);
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

		this.setTitle(this.mapInfo.title);
		var fields = [/*'title',*/ 'description', 'author', 'url', 'twitter'];
		for (var i = fields.length - 1; i >= 0; i--) {
			var el = this.$('.' + fields[i]);
			var contentEl = $('.content', el);
			if (!contentEl.length) {
				contentEl = el;
			}			
			var f = this.mapInfo[fields[i]];

			if (f && f != '') {
				if (fields[i] == 'description') {
					f = nl2p(f);
				}
				if (fields[i] == 'twitter') {
					f = 'https://twitter.com/#!/' + f;
				}
				contentEl.html(f);
				if (contentEl[0].tagName == 'A') {
					contentEl.attr('href', f);
				}
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