window.DataLegendView = window.DataViewBase.extend({

	className: 'data-legend',
	
    events: {
		'click .visibility:' : 'visibilityChanged',
    },

    initialize: function(options) {
		DataLegendView.__super__.initialize.call(this, options);
	    this.template = _.template(tpl.get('data-legend'));

		this.vent = options.vent;
		_.bindAll(this, "dataInfoViewResized");
	 	options.vent.bind("dataInfoViewResized", this.dataInfoViewResized);
	 },

	dataInfoViewResized: function(options) {
		this.initHistogram();
	},

});