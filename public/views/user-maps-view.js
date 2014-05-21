define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'permissions',
	'text!templates/user-maps.html',
	'views/map-list-view-base',
], function($, _, Backbone, config, utils, permissions, templateHtml, MapListViewBase) {
    "use strict";

	var UserMapsItemView = Backbone.View.extend({

	    tagName: 'tr',

	    events: {
	    },

	    initialize: function(options)
	    {
	    	this.template = _.template(options.templateHtml);
			this.listenTo(this.model, 'sync', this.populateFromModel);
	    },

	    sharingToggleClicked: function(evt)
	    {
	    	this.$('.sharing-status').attr('disabled', true);
	    	this.model.save(
	    		{sharing: $(evt.currentTarget).attr('data-value')}, {patch: true});
	    	this.hidePopovers();
	    	return false;
	    },

	    hidePopovers: function()
	    {
			this.superView.$el.parent().find('.sharing-status').popover('hide');
			this.superView.$el.parent().find('.popover').remove();
	    },

		setSuperView: function(view)
		{
			this.superView = view;
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

			$('.map-title', $el).text(this.model.attributes.title);
			$('.map-created-at', $el).text(
				moment(this.model.attributes.createdAt).format(locale.formats.DATE_SHORT));
			$('.admin-link', $el).attr('href', this.model.adminUrl());
			$('.map-link', $el).attr('href', url);
			if (this.model.attributes.previewImage) {
				$('.preview-image', $el)
					.attr('src', this.model.attributes.previewImage);
			} else {
				$('.preview-image-container', $el).hide();
			}

			$('.has-tooltip', $el).tooltip();

			if (!permissions.canAdminModel(this.model)) {
				this.$('.admin-control').remove();
			} else {
				var popoverTitle, popoverContent;
				switch (this.model.attributes.sharing) {
					case SharingType.PRIVATE:
						this.$('.is-public').hide();
						this.$('.is-private').show();
						popoverTitle = __('This map is private.');
						popoverContent = 
							'<p class="micro">' + __('You are the only one who can edit it, but it will be visible to people who have the <strong>secret link</strong>.') + '</p>'
							+__('<a href="#" class="btn btn-warning btn-sm sharing-toggle" data-value="' + SharingType.WORLD +'"><span class="glyphicon glyphicon-i"></span> Allow everybody to view this map</a>')
						break;
					case SharingType.WORLD:
						this.$('.is-private').hide();
						this.$('.is-public').show();
						popoverTitle = __('This map is public.');
						popoverContent = 
							'<p class="micro">' + __('You are the only one who can edit it, but it will be <strong>publicly visible</strong> on the web.') + '</p>'
							+__('<a href="#" class="btn btn-danger btn-sm sharing-toggle make-private" data-value="' + SharingType.PRIVATE +'""><span class="glyphicon glyphicon-lock"></span> Make this map private</a>')
						break;
				}

				var $trigger = this.$('.sharing-status');
				$trigger.popover('destroy')
		    		.attr('disabled', false)
					.popover({
						animation: false,
						content: popoverContent,
						html: popoverContent,
						title: popoverTitle,
						//container: self.superView.$el,
						placement: function() {
							if ($(window).innerWidth() - self.superView.$el.outerWidth() < 300) {
								return 'left';
							}
							return 'right';
						}
					}).on('show.bs.popover', function(evt) {
						self.hidePopovers();
					}).on('shown.bs.popover', function(evt) {
						$('.sharing-toggle').click(function(evt) {
							return self.sharingToggleClicked(evt);
						});
						evt.stopPropagation();
					});
			}
	    },
	
	});

	var UserMapsView = MapListViewBase.extend({

	    initialize: function(options) 
	    {
		    this.template = _.template(templateHtml);
		    this.mapType = 'user';
		},

	    render: function() 
	    {
	    	UserMapsView.__super__.render.apply(this, arguments);
	    	this.itemTemplateHtml = this.$('.element-template').remove()
	    		.clone().removeClass('element-template').html();
	        return this;
	    },

		createSubView: function(options)
		{
	    	return new UserMapsItemView(_.extend(
	    		{templateHtml: this.itemTemplateHtml}, options));
		}
	
	});

	return UserMapsView;
});