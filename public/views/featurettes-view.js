define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/featurettes.html',
	'views/map-list-view-base'
], function($, _, Backbone, config, utils, templateHtml, MapListViewBase) {
	"use strict";

	var FeaturetteView = Backbone.View.extend({

		initialize: function(options)
		{
			this.template = _.template(options.templateHtml);
			this.index = options.index;
		},

		render: function() 
		{
			this.$el.html(this.template());
			this.populateFromModel();
			return this;
		},

		populateFromModel: function()
		{
			var self = this,
				$el = this.$el,
				url = this.model.publicUrl();

			if (this.index % 2 == 1) {
				$('.col-md-8', $el).before(
					$('.col-md-4', $el).remove());
			}

			$('.map-title', $el).text(this.model.attributes.title);
			$('.map-created-at', $el).text(
				moment(this.model.attributes.createdAt).format(locale.formats.DATE_SHORT));
			$('.map-description', $el).text(
				maxWords(this.model.attributes.description, 70));
			$('.admin-link', $el).attr('href', this.model.adminUrl());
			$('.map-link', $el).attr('href', url);
			if (this.model.attributes.previewImage) {
				$('.preview-image', $el)
					.attr('src', this.model.attributes.previewImage);
			} else {
				$('.preview-image-container', $el).hide();
			}
		}

	});

	var FeaturettesView = MapListViewBase.extend({

		initialize: function(options) 
		{
			this.template = _.template(templateHtml);
			this.mapType = 'featured';
		},

		render: function() 
		{
			FeaturettesView.__super__.render.apply(this, arguments);
			this.itemTemplateHtml = this.$('.element-template').remove()
				.clone().removeClass('element-template').html();
			return this;
		},

		createSubView: function(options)
		{
			return new FeaturetteView(_.extend(
				{templateHtml: this.itemTemplateHtml}, options));
		}

	
	});

	return FeaturettesView;
});