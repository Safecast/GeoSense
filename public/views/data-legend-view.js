window.DataLegendView = window.DataViewBase.extend({

	className: 'data-legend',
	
    events: {
		'click .visibility:' : 'visibilityChanged',
    },

    initialize: function(options) {
		DataLegendView.__super__.initialize.call(this, options);
	    this.template = _.template(tpl.get('data-legend'));

		this.vent = options.vent;
		_.bindAll(this, "dataInfoViewResized");
	 	options.vent.bind("dataInfoViewResized", this.dataInfoViewResized);
	 },

	dataInfoViewResized: function(options) {
		this.initHistogram();
	},

	toggleLayerVisibility: function(pointCollectionId, state)
	{	
		if (pointCollectionId != this.mapLayer.pointCollection._id) return;
		DataLegendView.__super__.toggleLayerVisibility.call(this, pointCollectionId, state);
		
		var collapsible = this.$('.collapse');
		if (this.visible) {
			$(this.el).css('opacity', 1);
			if (!collapsible.is('.in')) {
				collapsible.collapse('show');
			}
		} else {
			$(this.el).css('opacity', .4);
			if (collapsible.is('.in')) {
				// TODO: disables the collabsible -- it can't be expanded after this call
				collapsible.collapse('hide');
			}
		}
	}

});