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
	    	'change .model-input.layer-toggle': 'layerToggled',
	    	'change .model-input, .color-palette input, .color-palette select': 'modelInputChanged',
	    	// does not work well with live preview since val is unchanged
	    	// 'keydown .model-input, .color-palette input, .color-palette select': 'modelInputChanged',
	    	'change .preview': 'previewChanged',
	    	'change .show-advanced': 'showAdvancedChanged',
	    	'click .generate-colors': 'generateColorsClicked',
	    	'click .hide-color-generator': 'hideColorGenerator',
	    	'click .remove-color': 'removeColorClicked',
	    	'click .add-color': 'addColorClicked',
	    	'click .btn': function() { return false }
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
	    	var self = this,
	    		featureCollection = this.model.attributes.featureCollection;
			MapLayerEditorView.__super__.render.call(this);

	    	this.colorRowTemplate = this.$('.color-palette tr.element-template').remove()
	    		.clone().removeClass('element-template');
			this.initModelInputs();
			this.initSliders();

			this.$('select.field-names').each(function() {
				var fieldType = $(this).attr('data-type'),
					opts = [];
				_.each(featureCollection.fields, function(field) {
					if (field.name.match(/^properties\./) && (!fieldType || fieldType == field.type)) {
						opts.push('<option value="%(name)s">%(label)s</option>'.format(field));
					}
				})
				$(this).append(opts.join('\n'));
			});

			this.$('.has-popover').each(function() {
				var trigger = $(this),
					sel = trigger.attr('data-content-selector');
				if (sel) {
					var el = self.$(sel).remove();
					$(this).popover({
						content: el,
						html: true,
					});
					$(this).on('shown', function(event, item) {
						trigger.addClass('active');
					});
					$(this).on('hidden', function(event, item) {
						trigger.removeClass('active');

					});
				}  else {
					$(this).popover({});
				}
			});

			this.populateFromModel();
			this.initColorPicker(this.$('.model-input.color-picker'));

			this.$('.color-palette tbody').sortable({
				handle: '.drag-handle',
				stop: function(event, ui) {
					self.modelInputChanged(event);
				}
			});

			this.initColorPicker(this.$('.model-input.color-picker'));

			this.$('.has-tooltip').tooltip({ delay: 0, animation: false });

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
	    	var self = this,
	    		or = function(val1, val2) {
	    			return !isNaN(val1) ? val1 : val2
	    		};
			this.$('.slider').each(function() {
				var fieldName = $(this).attr('data-field'),
					min = or(parseFloat($(this).attr('data-min')), 0),
					max = or(parseFloat($(this).attr('data-max')), 1);
				$(this).slider({
					min: min,
					max: max,
					range: "min",
					step: (max == 1 ? .05 : 1),
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

		showAdvancedChanged: function(event)
		{
			this.setButtonState();
		},

	    isPreviewEnabled: function()
	    {
			return this.$('.preview').is(':checked');
	    },

	    hideColorGenerator: function(event) {
	    	this.$('.show-color-generator').popover('hide');
	    	return false;
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
	    	if (this.$('.color-palette tbody tr').length <= 2) {
		    	this.$('.show-color-generator').attr('disabled', false);
	    	} else {
		    	this.$('.show-color-generator').attr('disabled', true);
	    	}
	    	this.hideColorGenerator();

	    	var showAdvanced = this.$('.show-advanced').is(':checked');
			this.$('.advanced').each(function() {
				if (!$(this).hasClass('feature-settings')) {
					$(this).toggle(showAdvanced);
				}
			});
	    	var featureType = this.getValueFromModelInput('layerOptions.featureType');
	    	this.$('.feature-settings').each(function() {
	    		$(this).toggle($(this).hasClass(featureType) && 
	    			(showAdvanced || !$(this).hasClass('advanced')));
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

	    populateColorTable: function(colors) 
	    {
	    	var self = this;
	    	this.$('.color-palette tbody').empty();
	    	var colors = colors || this.model.get('layerOptions.colors');
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

	    generateColorsClicked: function(event) 
	    {
	    	var type = $('input[name=colorSchemeType]:checked').val(),
	    		steps = parseInt($('input[name=colorSchemeSteps]').val()),
	    		colors = this.getColorsFromTable();
	    	this.$('.show-color-generator').popover('hide');
	    	if (steps && !isNaN(steps)) {
	    		var baseRGB = getRGBChannels(colors[0].color),
	    			baseHSB = rgb2hsb(baseRGB),
	    			baseH = baseHSB[0], baseS = baseHSB[1], baseB = baseHSB[2],
	    			minB = Math.min(.3, baseB),
	    			maxB = 1.0,
	    			minS = 0,
	    			reduceS = .3,
	    			increaseB = .1,
	    			threshB = .75,
	    			compHSB;

    			switch (type) {
    				case 'sequential':
		    			compHSB = colors.length > 1 ? 
		    				rgb2hsb(getRGBChannels(colors[colors.length - 1].color))
		    				: [baseH, baseS, baseB < threshB ? maxB : minB];
    					break;
    				case 'qualitative':
    				case 'diverging':
		    			compHSB = colors.length > 1 ? 
		    				rgb2hsb(getRGBChannels(colors[colors.length - 1].color)) 
		    				: [(baseH + 180) % 360, baseS, baseB];
		    			break;
	    		}

		    	var compH = compHSB[0], compS = compHSB[1], compB = compHSB[2],
	    			compRGB = hsb2rgb(compHSB),
	    			lerp = function(p, a, b) { return a + (b - a) * p; },
					genColors = [],
					increment = steps > 1 ? 1.0 / (steps - 1) : 0;

	    		for (var i = 0; i < steps; i++) {
	    			var perc = increment * i,
	    				proxToCenter = 1 - Math.abs(.5 - perc) / .5,
						rgb;

	    			switch (type) {
	    				case 'qualitative':
	    					var altPerc = perc + (!i ? 0 : (i % 2 ? increment : -increment)),
	    						hsb = [
		    						(baseH + (compH - baseH) * altPerc) % 360,
		    						lerp(perc, baseS, compS),
		    						lerp(perc, baseB, compB)
		    					];
	    					rgb = hsb2rgb(hsb);
	    					break;
	    				case 'sequential':
							rgb = [
								lerp(perc, baseRGB[0], compRGB[0]),
								lerp(perc, baseRGB[1], compRGB[1]),
								lerp(perc, baseRGB[2], compRGB[2])
							];
			    			break;
			    		case 'diverging':
							rgb = [
								lerp(perc, baseRGB[0], compRGB[0]),
								lerp(perc, baseRGB[1], compRGB[1]),
								lerp(perc, baseRGB[2], compRGB[2])
							];
							// make lighter towards midrange
							var hsb = rgb2hsb(rgb);
							hsb[2] = lerp(perc, baseB, compB);
							hsb[2] = Math.min(maxB, hsb[2] * (1 + proxToCenter * increaseB));
							// slightly reduce saturation towards midrange
							hsb[1] = Math.max(minS, hsb[1] - proxToCenter * reduceS);
							rgb = hsb2rgb(hsb); 
							break;
	    			}

	    			var color = intToColor(rgb2int(rgb));
	    			genColors.push({
	    				color: color, 
	    				position: Math.round(perc * 100) + '%',
	    				interpolation: 'threshold'
	    			});
	    		}
	    		for (var i = 0; i < genColors.length; i++) {
	    			this.addColorRow(genColors[i]);
	    		}
	    		this.populateColorTable(genColors);
	    		this.modelInputChanged();
	    	}
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
