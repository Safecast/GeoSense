define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/data-inspector.html',
	'views/data-view-base'
], function($, _, Backbone, config, utils, templateHtml, DataViewBase) {
	var DataInspectorView = DataViewBase.extend({

		className: 'data-inspector',
		
	    events: {
			'click #removeData' : 'removeDataClicked',
			'click #editData' : 'editDataClicked',
			'click #updateData' : 'updateDataClicked',

			'click .color-type' : 'colorTypeChanged',
			'click .feature-type' : 'featureTypeChanged',
			'click .legend-button' : 'visibilityChanged',
			'click .visibility' : 'visibilityChanged',
			
			'click #colorInput' : 'colorInputClicked',
			
	    },

	    initialize: function(options) {
			DataInspectorView.__super__.initialize.call(this, options);
		    this.template = _.template(templateHtml);
			this.histogramColors = [{color: "#666666"}];
		},

		setParameters: function()
		{
			DataInspectorView.__super__.setParameters.call(this);

			this.initGradientEditor();
			this.initPaletteEditor();
			this.featureTypeChanged();
			this.colorTypeChanged();
			this.initColorPicker(this.$("#colorInput"));
		},

	    initColorPicker: function(input, val) 
	    {
	    	var self = this;
			$(input).miniColors('value', val);	
			$(input).miniColors({
			    change: function(hex, rgb) { 
					self.enableUpdateButton();
				}
			});
			if (!val) {
				val = '#0aa5ff';
			}
	    },

	    initGradientEditor: function() 
	    {
	    	var colors = [];
	    	var self = this;
	    	for (var i = 0; i < this.colors.length; i++) {
				colors[i] = {
					color: this.colors[i].color,
					position: this.colors[i].position || 0.0
				};
	    	}
	    	if (colors.length == 1) {
	    		colors[1] = {
					color: colors[0].color,
					position: 1.0
				};
	    	}

			this.$("#gradientEditor").gradientEditor({
				width: 220,  
				height: 30,
				stopWidth: 12,
				stopHeight: 10,
				initialColor: "#ff00ff",
				onChange: function(colors) {
					self.colors = colors;
					self.enableUpdateButton();
				},
				colors: colors
			});
	    },

	    initPaletteEditor: function() 
	    {
	    	var colors = [];
	    	var self = this;
	    	var tbody = this.$('.color-palette tbody');
	    	var template = this.$('.color-palette tr.template').clone();
	    	template.removeClass('template');
	    	template.show();

	    	for (var i = 0; i < this.colors.length; i++) {
				var c = {
					color: this.colors[i].color,
					absPosition: this.colors[i].absPosition || 0.0,
					interpolation: this.colors[i].interpolation || ''
				};
				var row = template.clone();
				this.initColorPicker($('.color-picker', row), c.color);
				$('[name=absPosition]', row).val(c.absPosition);
				$('[name=interpolation] option', row).each(function() {
					$(this).attr('selected', $(this).val() == c.interpolation || 
						(c.interpolation == '' && $(this).val() == ColorGradient.prototype.interpolation.default));
				});
				tbody.append(row);
	    	}
	    },

	    getColorsFromPaletteEditor: function() 
	    {
	    	var colors = [];
	    	this.$('.color-palette tbody tr').each(function() {
	    		if ($(this).is('.template')) return;
				var c = {
					color: $('.color-picker', this).val(),
					absPosition: parseFloat($('[name=absPosition]', this).val()),
					interpolation: $('[name=interpolation]', this).val()
				};
				colors.push(c);
	    	});
	    	return colors;
	    }


	});

	return DataInspectorView;
});
