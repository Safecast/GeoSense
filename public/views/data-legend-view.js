define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/data-legend.html',
	'views/data-view-base'
], function($, _, Backbone, config, utils, templateHtml, DataViewBase) {
	var DataLegendView = DataViewBase.extend({

		className: 'data-legend',
		
	    events: {
			'click .visibility' : 'visibilityChanged',
			'click .show-map-layer-editor': 'showMapLayerEditorClicked'
	    },

	    initialize: function(options) {
			DataLegendView.__super__.initialize.call(this, options);
		    this.template = _.template(templateHtml);

			this.vent = options.vent;
			_.bindAll(this, "dataInfoViewResized");
		 	options.vent.bind("dataInfoViewResized", this.dataInfoViewResized);
		},

	    updateStatus: function() 
	    {
			DataLegendView.__super__.updateStatus.call(this);
	    },

		dataInfoViewResized: function(options) {
			if (this.mapLayer.options.histogram) {
				this.initHistogram();
			}
		},

		toggleLayerVisibility: function(pointCollectionId, state, hideCompletely)
		{	
			if (pointCollectionId != this.mapLayer.pointCollection._id) return;
			DataLegendView.__super__.toggleLayerVisibility.call(this, pointCollectionId, state, hideCompletely);
			
			var collapsible = this.$('.collapse');
			if (state || !hideCompletely) {
				if (this.visible) {
					$(this.el).css('opacity', 1);
					if (!collapsible.is('.in')) {
						collapsible.collapse('show');
					}
				} else {
					$(this.el).css('opacity', .4);
					if (collapsible.is('.in')) {
						collapsible.collapse('hide');
					}
				}
			}
		},

		showMapLayerEditorClicked: function(event)
		{
			this.vent.trigger('showMapLayerEditor', this.mapLayer._id);
			return false;
		}

	});

	return DataLegendView;
});
