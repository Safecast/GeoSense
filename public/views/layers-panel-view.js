define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/layers-panel.html',
	'views/panel-view-base'
], function($, _, Backbone, config, utils, templateHtml, PanelViewBase) {
    "use strict";

	var LayersPanelView = PanelViewBase.extend({

		className: 'panel panel-default layers-panel',
	  	subViewContainer: '.layers-container',

	    events: {
	    },

	    initialize: function(options) 
	    {
	    	LayersPanelView.__super__.initialize.call(this, options);
		    this.template = _.template(templateHtml);	
			this.sortableItemsSelector = '.map-layer';
			this.sortableHandleSelector = '.collapsible-heading';
	    },

		render: function()
		{
			LayersPanelView.__super__.render.call(this);
			this.initSortable();

			return this;
		},

		getSortableItemIndex: function(item)
		{
			return this.$(this.sortableItemsSelector).index(item);
		},

		initSortable: function()
		{
			var self = this;
			this.layerSortable = this.$('.panel-body').sortable({
				items: this.sortableItemsSelector,
				handle: this.sortableHandleSelector,
				start: function(event, ui) {
					$(ui.item).data('previousIndex', self.getSortableItemIndex(ui.item));
				},
				stop: function(event, ui) {
					if ($(ui.item).data('previousIndex') != self.getSortableItemIndex(ui.item)) {
						self.layerMoved(event, ui);
					}
				}
			});
		},

		layerMoved: function(event, ui)
		{
			var layer = app.getMapLayer($(ui.item).attr('data-id'));
			layer.set({position: this.getSortableItemIndex(ui.item)}, {
				silent: false
			});
			if (app.isMapAdmin()) {
				layer.save();
			}
		}


	});

	return LayersPanelView;
});
