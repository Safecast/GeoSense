window.DataInfoView = Backbone.View.extend({

    tagName: 'div',
	className: 'data-info',
	
    events: {
    },

    initialize: function(options) {
    	
	    this.template = _.template(tpl.get('data-info'));	
		this.vent = options.vent;
		this.responseData = null;
		this.dataTitle = '';
		this.dataColor = '#ffffff';

		_.bindAll(this, "showDetailData");
	 	options.vent.bind("showDetailData", this.showDetailData);
		_.bindAll(this, "hideDetailData");
	 	options.vent.bind("hideDetailData", this.hideDetailData);
    },

    showDetailData: function(obj)
	{	
		var legend = this.$('.data-legend.'+obj.collectionId);

		var table = $('.detail-data', legend);
		var items = '';
		for (var i = 0; i < obj.data.length; i++) {
			items += '<tr><th class="value-label">' + obj.data[i]['label'] + '</th><td class="value">' + obj.data[i]['value'] + '</td></tr>';
		} 	
		table.html(items);

		var table = $('.detail-metadata', legend);
		var items = '';
		for (var i = 0; i < obj.metadata.length; i++) {
			if (obj.metadata[i]['label']) {
				items += '<tr><th class="value-label">' + obj.metadata[i]['label'] + '</th><td class="value">' + obj.metadata[i]['value'] + '</td></tr>';
			} else {
				items += '<tr><td colspan="2" class="value single">' + obj.metadata[i]['value'] + '</td></tr>';
			}
		} 	
		table.html(items);

		var collapsible = $('.collapse', legend);
		// hide first to prevent flicker
		collapsible.collapse('hide');
		collapsible.collapse('show');
	},

    hideDetailData: function(obj)
	{	
		var legend = this.$('.data-legend.'+obj.collectionId);
		var collapsible = $('.collapse', legend);
		collapsible.collapse('hide');
	},

    render: function() {
		$(this.el).html(this.template());
		var self = this;

        return this;
    },
});