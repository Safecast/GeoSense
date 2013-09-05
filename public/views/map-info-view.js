define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/map-info-modal.html',
	'views/modal-view'
], function($, _, Backbone, config, utils, templateHtml, ModalView) {
    "use strict";

	//var MapInfoView = PanelViewBase.extend({
	var MapInfoView = ModalView.extend({

		/*className: 'panel panel-default map-info',*/
	    events: {
	    },

	    initialize: function(options) 
	    {    	
	    	MapInfoView.__super__.initialize.call(this, options);
		    this.template = _.template(templateHtml);
		    this.listenTo(this.model, 'sync', this.populateFromModel);
		},

		populateFromModel: function()
		{
			var mapInfo = this.model.attributes;
			this.setTitle(mapInfo.title);
			var fields = [/*'title',*/ 'description', 'author', 'linkURL', 'twitter'];
			for (var i = fields.length - 1; i >= 0; i--) {
				var el = this.$('.' + fields[i]);
				var contentEl = $('.content', el);
				if (!contentEl.length) {
					contentEl = el;
				}			
				var f = mapInfo[fields[i]];

				if (f && f != '') {
					if (fields[i] == 'description') {
						f = nl2p(f);
					}
					if (fields[i] == 'twitter') {
						f = 'https://twitter.com/' + f;
					}
					contentEl.html(f);
					if (contentEl[0].tagName == 'A') {
						contentEl.attr('href', f);
					}
					el.show();		
				} else {
					el.hide();
				}
			}
		},

		render: function()
		{
			MapInfoView.__super__.render.call(this);
			this.populateFromModel();

			return this;
		}
	});

	return MapInfoView;
});
