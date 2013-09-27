define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/share.html',
	'views/modal-view'
], function($, _, Backbone, config, utils, templateHtml, ModalView) {
    "use strict";

	var ShareView = ModalView.extend({

		/*className: 'panel map-info',*/
	    events: {
	    },

	    initialize: function(options) {
		    this.template = _.template(templateHtml);
	    },
		

		render: function()
		{
			ShareView.__super__.render.call(this);
			this.$(".map-url, .iframe").click(function() {
				$(this).select();
			});
			return this;
		},

		show: function()
		{
			var url = app.currentPublicMapUrl();
			this.$('.map-url').val(url);
			this.$('.iframe').val(
				'<iframe width="920" height="640" frameborder="0" scrolling="auto" marginwidth="0" marginheight="0" src="%(url)s"></iframe>'
				.format({url: url}));
			this.$('.alert.private').toggle(app.map.isPrivate());
			ShareView.__super__.show.call(this);
		}

	});

	return ShareView;
});
