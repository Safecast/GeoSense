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

		_.bindAll(this, "updateDetailData");
	 	options.vent.bind("updateDetailData", this.updateDetailData);
    },

    updateDetailData: function(obj)
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
				items += '<tr><td colspan="2" class="value">' + obj.metadata[i]['value'] + '</td></tr>';
			}
		} 	
		table.html(items);

		var collapsible = $('.collapse', legend);
		if (1||!collapsible.is(':visible')) {
			collapsible.collapse('show');
		}
	},

    render: function() {
		$(this.el).html(this.template());
		var self = this;

        return this;
    },
});