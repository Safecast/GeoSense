define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/data-info.html',
	'views/panel-view-base'
], function($, _, Backbone, config, utils, templateHtml, PanelViewBase) {
	var DataInfoView = PanelViewBase.extend({

		className: 'panel data-info',
		
	    events: {
	    },

	    initialize: function(options) 
	    {
		    this.template = _.template(templateHtml);	
			this.vent = options.vent;
	    }

	});

	return DataInfoView;
});
