define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/map-layer-editor.html',
	'views/panel-view-base',
	'lib/color-gradient/color-gradient',
	'deepextend'
], function($, _, Backbone, config, utils, templateHtml, PanelViewBase, ColorGradient) {

	var ModelEditorMixin = {

		initModelInputs: function() {
			var self = this;
			this.modelInputs = {};
			this.$('.model-input').each(function() {
				var name;
				if ($(this).is('input, textarea')) {
					name = $(this).attr('name');
				} else {
					name = $(this).attr('data-name');
				}
				if (!self.modelInputs[name]) {
					self.modelInputs[name] = [];
				}
				self.modelInputs[name].push(this);
			});
		},

		populateModelInputs: function() {
			for (var name in this.modelInputs) {
				var val = this.model.get(name);
				this.populateModelInput(name, val);
			}
			this.isChanged = false;
		},

		populateModelInput: function(name, val) {
			var self = this;
			$(self.modelInputs[name]).each(function() {
				if ($(this).is('.btn-group')) {
			    	self.$('.btn', this).each(function() {
				    	if ($(this).val() != val) {
					    	$(this).removeClass('active');
				    	} else {
					    	$(this).addClass('active');
				    	}
			    	});
				} else {
					$(this).val(val);
				}
			})
		},

		getModelInputValues: function()
		{
			var values = {};
			for (var name in this.modelInputs) {
				values[name] = $(this.modelInputs[name]).val();
			}
			// utilizes model class and DeepModel if applicable to return expanded attrs
			var model = new this.model.__proto__.constructor(this.model.attributes, {});
			model.set(values, {});
			return model.attributes;
		},

		handleValidationErrors: function(xhr) 
		{
			var data = $.parseJSON(xhr.responseText);
			if (data && data.errors) {
				console.error('errors:', data.errors);
			}
		},

	};

	var MapLayerEditorView = PanelViewBase.extend({

		className: 'panel map-layer-editor',
		
	    events: {
	    	'click .btn.save': 'saveButtonClicked',
	    	'click .btn.undo': 'undoButtonClicked',
	    	'click .btn.destroy': 'destroyButtonClicked',
	    	'click .btn.feature-type': 'featureTypeClicked',
	    	'change .model-input, .color-palette input, .color-palette select': 'modelInputChanged',
	    	// does not work well with live preview since val is unchanged
	    	// 'keydown .model-input, .color-palette input, .color-palette select': 'modelInputChanged',
	    	'click .preview': 'modelInputChanged',
	    	'click .remove-color': 'removeColorClicked',
	    	'click .add-color': 'addColorClicked'
	    },

	    initialize: function(options) 
	    {
		    this.template = _.template(templateHtml);	
			this.vent = options.vent;
	    },

	    render: function() 
	    {
			MapLayerEditorView.__super__.render.call(this);
	    	this.colorRowTemplate = this.$('.color-palette tr.element-template').remove()
	    		.clone().removeClass('element-template');
			this.initModelInputs();
			this.initSliders();
			this.populateFromModel();
	    	console.log(this.colorRowTemplate);
			return this;
	    },

	    initSliders: function() 
	    {
	    	var self = this;
			this.$('.opacity-slider').slider({
				min: 0,
				max: 1,
				range: "min",
				step: .05,
				slide: function( event, ui ) {
					$(self.modelInputs['options.opacity'][0]).val(ui.value);
					self.modelInputChanged();
				}
		    });
		    $(self.modelInputs['options.opacity'][0]).change(function() {
		    	self.updateSliders();
		    });
		},

		updateSliders: function() 
		{
	    	var self = this;
	    	self.$('.opacity-slider').slider('value', $(self.modelInputs['options.opacity'][0]).val());
		},

	    populateFromModel: function()
	    {
			this.populateModelInputs();
			this.$('.panel-header .title').text(this.model.get('options.title'));
			this.populateColorTable();
			this.setButtonState(false);
			this.updateSliders();
	    },

	    getCompleteModelInputValues: function()
	    {
	    	var values = ModelEditorMixin.getModelInputValues.apply(this);
	    	values.options.colors = this.getColorsFromTable();
	    	return values;
	    },

	    undoButtonClicked: function(event) {
	    	this.populateFromModel();
	    	this.modelInputChanged(event, true);
	    	this.setButtonState(false);
	    },

	    saveButtonClicked: function(event) {
	    	var self = this;
	    	if (!this.isChanged) return false;

	    	this.setButtonState(false);
	    	this.model.save(this.getCompleteModelInputValues(), {
	    		success: function(model, response, options) {
	    			console.log('saved layer options');
	    			self.populateFromModel();
					self.vent.trigger('updateMapLayer', model.attributes);
	    		},
	    		error: function(model, xhr, options) {
			    	self.setButtonState(true);
	    			console.log('error saving layer options');
	    			self.handleValidationErrors(xhr);
	    		}
	    	});
	    	return false;
	    },

		destroyButtonClicked: function(e) {
			var self = this;
			if (window.confirm(__('Are you sure you want to delete this layer? This action cannot be reversed!'))) {
				console.log('delete');
				this.model.destroy();
			}
			return false;
		},

	    featureTypeClicked: function(event) {
	    	this.populateModelInput('options.featureType', $(event.currentTarget).val());
	    	this.modelInputChanged(event);
	    	return false;
	    },

	    modelInputChanged: function(event, forcePreview) {
	    	this.isChanged = true;
	    	this.setButtonState(this.isChanged);
	    	if (forcePreview || this.$('.preview').is(':checked')) {
				this.vent.trigger('updateMapLayer', this.getCompleteModelInputValues());
	    	}
	    },

	    setButtonState: function(state) {
	    	this.$('.btn.undo').attr('disabled', !state);
	    	this.$('.btn.save').attr('disabled', !state);
	    	if (this.$('.color-palette tbody tr').length > 1) {
		    	this.$('.remove-color').show();
	    	} else {
		    	this.$('.remove-color').hide();
	    	}
	    },

	    initColorPicker: function(input, val) 
	    {
	    	var self = this;
			$(input).miniColors('value', val);	
			$(input).miniColors({
			    change: function(hex, rgb) { 
					self.modelInputChanged()
				}
			});
			if (!val) {
				val = '#0aa5ff';
			}
	    },

	    addColorRow: function(c)
	    {
	    	var c = c || {};
			var row = this.colorRowTemplate.clone();
			$('[name=position]', row).val(c.position || '');
			this.initColorPicker($('.color-picker', row), c.color);
			$('[name=interpolation] option', row).each(function() {
				$(this).attr('selected', $(this).val() == c.interpolation || 
					(c.interpolation == '' && $(this).val() == ColorGradient.prototype.interpolation.default));
			});
			this.$('.color-palette tbody').append(row);
			return row;
	    },

	    populateColorTable: function() 
	    {
	    	var colors = [];
	    	var self = this;
	    	this.$('.color-palette tbody').empty();

	    	var colors = this.model.get('options.colors');

	    	for (var i = 0; i < colors.length; i++) {
				var c = {
					color: colors[i].color,
					position: colors[i].position || '100%',
					interpolation: colors[i].interpolation || ''
				};
				var row = this.addColorRow(c);
	    	}
	    },

	    getColorsFromTable: function() 
	    {
	    	var colors = [];
	    	this.$('.color-palette tbody tr').each(function() {
	    		if ($(this).is('.element-template')) return;
				var c = {
					color: $('.color-picker', this).val(),
					position: $('[name=position]', this).val(),
					interpolation: $('[name=interpolation]', this).val()
				};
				colors.push(c);
	    	});
	    	return colors;
	    },

	    removeColorClicked: function(event) 
	    {
			$(event.currentTarget).closest('tr').remove();
			this.modelInputChanged();
			return false;
	    },

	    addColorClicked: function(event) 
	    {
	    	this.addColorRow();
			this.modelInputChanged();
			return false;
	    }


	});

	_.extend(MapLayerEditorView.prototype, ModelEditorMixin);

	return MapLayerEditorView;
});
