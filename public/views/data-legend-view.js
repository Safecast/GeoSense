window.DataLegendView = window.DataViewBase.extend({

	className: 'data-legend',
	
    events: {
		'click #removeData:' : 'removeDataClicked',
		'click #editData:' : 'editDataClicked',
		'click #updateData' : 'updateDataClicked',

		'click .color-type:' : 'colorTypeChanged',
		'click .feature-type:' : 'featureTypeChanged',
		'click .legend-button:' : 'visibilityChanged',
		'click .visibility:' : 'visibilityChanged',
		
		'click #colorInput' : 'colorInputClicked',
		'click #colorInputLow' : 'colorInputLowClicked',
		'click #colorInputHigh' : 'colorInputHighClicked',
		
    },

    initialize: function(options) {
		DataLegendView.__super__.initialize.call(this, options);
	    this.template = _.template(tpl.get('data-legend'));

		this.vent = options.vent;
		_.bindAll(this, "dataInfoViewResized");
	 	options.vent.bind("dataInfoViewResized", this.dataInfoViewResized);
	 },

	dataInfoViewResized: function(options) {
		console.log('initHistogram');
		this.initHistogram();
	}


});