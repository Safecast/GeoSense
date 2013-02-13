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
				var name = $(this).attr('data-name') || $(this).attr('name');
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
				} else if ($(this).is('input[type=checkbox], input[type=radio]')) {
					console.log('CHECKBOX', val, name);
					$(this).attr('checked', val == true);
				} else {
					$(this).val(val);
				}
			})
		},

		getModelInputValues: function()
		{
			var values = {};
			for (var name in this.modelInputs) {
				var from = $(this.modelInputs[name][0]),
					val;
				if ($(from).is('input[type=checkbox], input[type=radio]')) {
					val = from.is(':checked');
				} else {
					val = from.val();
				}
				values[name] = val;
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
	    	'click .preview': 'updateMapLayer',
	    	'click .remove-color': 'removeColorClicked',
	    	'click .add-color': 'addColorClicked',
	    	'change .model-input.visibility': 'visibilityChanged'
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

			this.$('.layer-title').text(this.model.attributes.pointCollection.title);

			return this;
	    },

	    initSliders: function() 
	    {
	    	var self = this;
			this.$('.slider').each(function() {
				var fieldName = $(this).attr('data-field');
				$(this).slider({
					min: 0,
					max: 1,
					range: "min",
					step: .05,
					slide: function( event, ui ) {
						$(self.modelInputs[fieldName][0]).val(ui.value);
						self.modelInputChanged();
					}
			    });
			    $(self.modelInputs[fieldName][0]).change(function() {
			    	self.updateSliders();
			    });
			});
		},

		updateSliders: function() 
		{
	    	var self = this;
			this.$('.slider').each(function() {
				var fieldName = $(this).attr('data-field');
				$(this).slider('value', $(self.modelInputs[fieldName][0]).val());
			});
		},

	    populateFromModel: function()
	    {
			this.populateModelInputs();
			this.$('.panel-header .title').text(this.model.get('layerOptions.title'));
			this.populateColorTable();
			this.setButtonState(false);
			this.updateSliders();
	    },

	    getCompleteModelInputValues: function()
	    {
	    	var values = ModelEditorMixin.getModelInputValues.apply(this);
	    	values.layerOptions.colors = this.getColorsFromTable();
	    	return values;
	    },

	    undoButtonClicked: function(event) {
	    	this.populateFromModel();
			this.updateMapLayer(null, true);
	    	return false;
	    },

	    saveButtonClicked: function(event) {
	    	var self = this;
	    	if (!this.isChanged) return false;

	    	this.setButtonState(false);
	    	this.model.save(this.getCompleteModelInputValues(), {
	    		success: function(model, response, options) {
	    			console.log('saved layer');
	    			self.populateFromModel();
					self.vent.trigger('updateMapLayer', model.attributes);
	    		},
	    		error: function(model, xhr, options) {
			    	self.setButtonState(true);
	    			console.log('error saving layer');
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
	    	this.populateModelInput('layerOptions.featureType', $(event.currentTarget).val());
	    	this.modelInputChanged(event);
	    	return false;
	    },

	    modelInputChanged: function(event) {
	    	this.isChanged = true;
	    	this.setButtonState(this.isChanged);
	    	this.updateMapLayer();
	    },

	    updateMapLayer: function(event, forcePreview) {
	    	if (forcePreview || this.$('.preview').is(':checked')) {
				this.vent.trigger('updateMapLayer', this.getCompleteModelInputValues());
	    	}
	    },

	    setButtonState: function(state) {
	    	if (state != undefined) {
		    	this.$('.btn.undo').attr('disabled', !state);
		    	this.$('.btn.save').attr('disabled', !state);
	    	}

	    	if (this.$('.color-palette tbody tr').length > 1) {
		    	this.$('.remove-color').attr('disabled', false);
	    	} else {
		    	this.$('.remove-color').attr('disabled', true);
	    	}

	    	var featureType = this.getCompleteModelInputValues().layerOptions.featureType;
	    	this.$('.feature-settings').each(function() {
	    		if (!$(this).hasClass(featureType)) {
	    			$(this).hide();
	    		} else {
	    			$(this).show();
	    		}
	    	});
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
			$('[name=position]', row).val(c.position || '0%');
			this.initColorPicker($('.color-picker', row), c.color || '#000000');
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

	    	var colors = this.model.get('layerOptions.colors');

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
	    	if ($(event.currentTarget).attr('disabled')) return false;
			$(event.currentTarget).closest('tr').remove();
			this.modelInputChanged();
			return false;
	    },

	    addColorClicked: function(event) 
	    {
	    	this.addColorRow();
			this.modelInputChanged();
			return false;
	    },

		visibilityChanged: function(event)
		{
			this.vent.trigger('toggleLayerVisibility', this.model.attributes.pointCollection._id, 
				$(event.currentTarget).is(':checked'));
		},


	});

	_.extend(MapLayerEditorView.prototype, ModelEditorMixin);

	return MapLayerEditorView;
});
