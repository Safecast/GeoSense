define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/baselayer-editor.html',
	'views/panel-view-base',
	'mixins/model-editor-mixin',
	'mixins/editor-widgets-mixin'
], function($, _, Backbone, config, utils, templateHtml, PanelViewBase, ModelEditorMixin, EditorWidgetsMixin) {
    "use strict";

	var baselayerEditorView = PanelViewBase.extend({

		className: 'panel panel-default baselayer-editor',
		
	    events: {
	    	'change .model-input': 'modelInputChanged',
	    },

	    initialize: function(options) 
	    {
	    	baselayerEditorView.__super__.initialize.call(this, options);
		    this.template = _.template(templateHtml);	
	    },

	    render: function() 
	    {
	    	var self = this,
	    		featureCollection = this.model.attributes.featureCollection;
			baselayerEditorView.__super__.render.call(this);
			this.initModelInputs();
			this.populateFromModel();
			this.initSliders();
			this.initColorPicker(this.$('.model-input.color-picker'));
			return this;
	    },

	    customPopulateFromModel: function() 
	    {
	    	var input = this.$('.model-input[name="viewOptions.baselayerOpacity"]');
	    	if (input.val() == '') {
		    	input.val('1');
	    	}
	    },

	    modelInputChanged: function(event) 
	    {
	    	app.setViewOptions(expandObj(this.getValuesFromModelInputs()).viewOptions);
	    }

	});

	_.extend(baselayerEditorView.prototype, ModelEditorMixin);
	_.extend(baselayerEditorView.prototype, EditorWidgetsMixin);

	return baselayerEditorView;
});
