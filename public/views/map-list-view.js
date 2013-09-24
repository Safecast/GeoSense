define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'models/map',
	'collections/maps',
	'mixins/spinner-mixin',
	'moment',
	'locale'
], function($, _, Backbone, config, utils, Map, Maps, SpinnerMixin, moment, locale) {
    "use strict";

	var MapListView = Backbone.View.extend({

	    tagName: 'div',
		className: 'object-list',

	    events: {
	    },

	    render: function() 
	    {
			this.$el.html(this.template());
	    	this.$elementTemplate = this.$('.element-template').remove()
	    		.clone().removeClass('element-template');
	    	this.$objects = this.$('.objects');
	    	this.initLargeSpinner(this.$el);
	        return this;
	    },

		fetchMaps: function() 
		{
			var self = this,
				maxWords = function(str, max) {
					var words = str.split(' ');
					if (words.length > max) {
						return words.splice(0, max).join(' ') + '…';
					}
					return str;
				};

			this.showSpinner();

			new Maps().forType(this.mapType).fetch({
				success: function(collection, response, options) {
					self.hideSpinner();
					collection.each(function(model, index) {
						var url = model.publicUrl(),
							$el = self.$elementTemplate.clone();
						$('.map-title', $el).text(model.attributes.title);
						$('.map-created-at', $el).text(
							moment(model.attributes.createdAt).format(locale.formats.DATE));
						$('.map-description', $el).text(
							maxWords(model.attributes.description, 70));
						$('.admin-link', $el).attr('href', model.adminUrl());
						$('.map-link', $el).attr('href', url);
						if (index % 2 == 1) {
							$('.col-md-8', $el).before(
								$('.col-md-4', $el).remove());
						}
						if (model.attributes.previewImage) {
							$('.preview-image', $el)
								.attr('src', model.attributes.previewImage);
						} else {
							$('.preview-image-container', $el).hide();
						}
						self.$objects.append($el);
					});
					if (collection.length) {
						self.$('.no-objects').addClass('hidden');
						self.$('.objects-container')
							.removeClass('hidden').hide().fadeIn('fast');
					} else {
						self.$('.objects-container').addClass('hidden');
						self.$('.no-objects')
							.removeClass('hidden').hide().fadeIn('fast');
					}
				},
				error: function(collection, response, options) {
					self.hideSpinner();
					console.error('failed to fetch feature maps');
				}
			});
			return this;
		},
		
	});

	_.extend(MapListView.prototype, SpinnerMixin);

	return MapListView;
});