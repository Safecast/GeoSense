window.DataInspectorView = window.DataViewBase.extend({

	className: 'data-inspector',
	
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

});