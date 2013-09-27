define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'permissions',
	'models/map',
	'collections/maps',
	'mixins/spinner-mixin',
	'moment',
	'locale'
], function($, _, Backbone, config, utils, permissions, Map, Maps, SpinnerMixin, moment, locale) {
    "use strict";

	var MapListViewBase = Backbone.View.extend({

	    tagName: 'div',
		className: 'object-list',

	    events: {
	    },

	    render: function() 
	    {
			this.$el.html(this.template());
	    	this.$objects = this.$('.objects');
	    	this.initLargeSpinner(this.$el);
	        return this;
	    },

		fetchMaps: function() 
		{
			var self = this;
			this.showSpinner();

			new Maps().forType(this.mapType).fetch({
				success: function(collection, response, options) {
					self.hideSpinner();
					collection.each(function(model, index) {
						var view = self.createSubView({
							model: model,
							index: index,
							templateHtml: self.itemTemplateHtml
						});
						self.appendSubView(view);
						view.render();
					});
					self.$('.objects-container').toggleClass('hidden', collection.length == 0);
					self.$('.no-objects').toggleClass('hidden', collection.length > 0);
				},
				error: function(collection, response, options) {
					self.hideSpinner();
					console.error('failed to fetch feature maps');
				}
			});
			return this;
		},

		createSubView: function()
		{
			console.error('createSubview is not implemented');
		},

		appendSubView: function(view, container)
		{
			this.$objects.append(view.el);
			if (view.setSuperView) {
				view.setSuperView(this);
			}
			return view;
		}		
		
	});

	_.extend(MapListViewBase.prototype, SpinnerMixin);

	return MapListViewBase;
});