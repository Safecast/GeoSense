define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/layer-panel.html',
	'views/panel-view-base'
], function($, _, Backbone, config, utils, templateHtml, PanelViewBase) {
	var LayerPanelView = PanelViewBase.extend({

		className: 'panel layer-panel',
		
	    events: {
	    },

	    initialize: function(options) 
	    {
		    this.template = _.template(templateHtml);	
			this.vent = options.vent;
			this.sortableItemsSelector = '.data-legend';
	    },

		render: function()
		{
			LayerPanelView.__super__.render.call(this);
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
				handle: '.move-map-layer',
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
			var layer = app.getMapLayer($(ui.item).attr('data-id'))
				previousPosition = layer.get('position');
			layer.set({position: this.getSortableItemIndex(ui.item)}, {});
			if (app.isMapAdmin()) {
				layer.save();
			}
			this.vent.trigger('mapLayerMoved', layer, layer.get('position'), previousPosition);
		}


	});

	return LayerPanelView;
});
