define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/map-layer-editor.html',
	'views/panel-view-base',
	'mixins/model-editor-mixin',
	'lib/color-gradient/color-gradient',
], function($, _, Backbone, config, utils, templateHtml, PanelViewBase, ModelEditorMixin, ColorGradient) {

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
	    	'change .preview': 'previewChanged',
	    	'click .remove-color': 'removeColorClicked',
	    	'click .add-color': 'addColorClicked',
	    	'change .model-input.layer-toggle': 'layerToggled'
	    },

	    initialize: function(options) 
	    {
	    	MapLayerEditorView.__super__.initialize.call(this, options);
		    this.template = _.template(templateHtml);	
		    this.listenTo(this.model, 'change', this.updateFromModel);
		    this.listenTo(this.model, 'sync', this.modelSynced);
		    this.listenTo(this.model, 'destroy', this.remove);
	    },

	    modelSynced: function(model)
	    {
			if (this.model.hasChanged('layerOptions')) {
				//this.populateFromModel();	
			} 
	    },

	    render: function() 
	    {
	    	var self = this;
			MapLayerEditorView.__super__.render.call(this);

	    	this.colorRowTemplate = this.$('.color-palette tr.element-template').remove()
	    		.clone().removeClass('element-template');
			this.initModelInputs();
			this.initSliders();
			this.populateFromModel();
			this.initColorPicker(this.$('.model-input.color-picker'));

			this.$('.color-palette tbody').sortable({
				handle: '.drag-handle',
				stop: function(event, ui) {
					self.modelInputChanged(event);
				}
			});

			return this;
	    },

	    updateFromModel: function()
	    {
	    	// do not populate form on model change since that breaks
	    	// things like the colorpicker 
			this.$('.model-title').text(
				this.model.attributes.layerOptions.title 
				&& this.model.attributes.layerOptions.title.length ?
					this.model.attributes.layerOptions.title
				: this.model.attributes.featureCollection.title);
			this.$('.model-numeric').toggle(this.model.isNumeric());
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
			this.updateFromModel();
			this.populateModelInputs();
			this.$('.panel-header .title').text(this.model.get('layerOptions.title'));
			this.populateColorTable();
			this.setButtonState(false);
			this.updateSliders();
	    },

	    getModelInputValues: function(values)
	    {
	    	values['layerOptions.colors'] = this.getColorsFromTable();
	    	return values;
	    },

	    undoButtonClicked: function(event) 
	    {
	    	this.model.set(_.extend(this.model.attributes, this.unchangedModelAttributes), {});
	    	this.populateFromModel();
	    	return false;
	    },

	    saveButtonClicked: function(event) 
	    {
	    	var self = this;
	    	if (!this.isChanged) return false;

	    	this.setButtonState(false);
	    	this.updateModelFromInputs();
	    	this.model.save({}, {
	    		success: function(model, response, options) {
	    			console.log('saved layer');
	    			self.populateFromModel();
	    		},
	    		error: function(model, xhr, options) {
			    	self.setButtonState(true);
	    			console.log('error saving layer');
	    			self.handleValidationErrors(xhr);
	    		}
	    	});
	    	return false;
	    },

		destroyButtonClicked: function(e) 
		{
			var self = this;
			if (window.confirm(__('Are you sure you want to delete this layer? This action cannot be reversed!'))) {
				this.model.destroy({
					success: function(model, response, options) {
					},
					error: function(model, xhr, options) {
					}
				});
			}
			return false;
		},

	    featureTypeClicked: function(event) 
	    {
	    	this.populateModelInput('layerOptions.featureType', $(event.currentTarget).val());
	    	this.modelInputChanged(event);
	    	return false;
	    },

	    modelInputChanged: function(event) 
	    {
	    	this.isChanged = true;
	    	this.setButtonState(this.isChanged);
	    	this.updateModelFromInputs({silent: !this.isPreviewEnabled()});
	    },

	    previewChanged: function(event) 
	    {
	    	if (this.isPreviewEnabled()) {
		    	this.updateModelFromInputs();
	    	}
	    },

	    isPreviewEnabled: function()
	    {
			return this.$('.preview').is(':checked');
	    },

	    setButtonState: function(state) 
	    {
	    	if (state != undefined) {
		    	this.$('.btn.undo').attr('disabled', !state);
		    	this.$('.btn.save').attr('disabled', !state);
	    	}

	    	if (this.$('.color-palette tbody tr').length > 1) {
		    	this.$('.remove-color').attr('disabled', false);
	    	} else {
		    	this.$('.remove-color').attr('disabled', true);
	    	}

	    	var featureType = this.getValueFromModelInput('layerOptions.featureType');
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
	    	if (val != undefined) {
				$(input).miniColors('value', val);	
	    	}
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
			row.attr('data-id', c._id);
			$('[name=position]', row).val(c.position || DEFAULT_COLOR_EDITOR_POSITION);
			this.initColorPicker($('.color-picker', row), c.color || DEFAULT_COLOR_EDITOR_COLOR);
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
				var row = this.addColorRow(colors[i]);
	    	}
	    },

	    getColorsFromTable: function() 
	    {
	    	var colors = [];
	    	this.$('.color-palette tbody tr').each(function() {
	    		if ($(this).is('.element-template')) return;
				var c = {
					_id: $(this).attr('data-id'),
					color: $('.color-picker', this).val(),
					position: $('[name=position]', this).val(),
					interpolation: $('[name=interpolation]', this).val()
				};
				if (!c._id.length) delete c._id;
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

		layerToggled: function(event)
		{
			this.model.toggleEnabled($(event.currentTarget).is(':checked'));
		},


	});

	_.extend(MapLayerEditorView.prototype, ModelEditorMixin);

	return MapLayerEditorView;
});
