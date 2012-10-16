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
		
		if (this.visible) {
			$(this.el).css('opacity', 1);
		} else {
			$(this.el).css('opacity', .4);
		}
	}

});