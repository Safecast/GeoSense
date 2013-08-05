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
    "use strict";

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
	    	'click .import-export': 'importExportClicked',
	    	'click .import-settings': 'importSettingsClicked',
	    	'change textarea[name=settings-json]': 'importSettingsChanged',
	    	'click textarea[name=settings-json]': function(event) {
	    		$(event.currentTarget).select();
	    		return false;
	    	},
	    	'click .hide-color-generator': 'hideColorGenerator',
	    	'click .remove-color': 'removeColorClicked',
	    	'click .add-color': 'addColorClicked',
	    	'click .color-schemes .color-scheme a': 'toggleColorScheme',
	    	'click .add-color-scheme a': 'addColorScheme',
	    	'click .delete-color-scheme a': 'deleteColorScheme',
	    	'change .color-scheme-name': 'colorSchemeNameChanged',
	    	'keydown input[type=text]': function(event) {
	    		if (event.which == 13) {
	    			$(event.currentTarget).select();
	    			$(event.currentTarget).trigger('change');
					// prevent button click
	    			return false;
	    		}
	    	}
	    },

	    initialize: function(options) 
	    {
	    	MapLayerEditorView.__super__.initialize.call(this, options);
		    this.template = _.template(templateHtml);	
		    this.listenTo(this.model, 'change', this.updateFromModel);
		    this.listenTo(this.model, 'sync', this.modelSynced);
		    this.listenTo(this.model, 'destroy', this.remove);
		    this.colorSchemeIndex = this.model.getLayerOptions().colorSchemeIndex || 0;
	    },

	    modelSynced: function(model)
	    {
			if (this.model.hasChanged('layerOptions')) {
			    // TODO this will overwrite unsaved changes:
				this.populateFromModel();	
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

			this.$('.dropdown-toggle').dropdown();

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
					trigger.click(function(event) {
						event.preventDefault();
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
			this.$('.model-title').text(this.model.getDisplay('title'));
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

		populateFieldInputs: function()
		{
	    	var self = this,
	    		fields = this.model.getFeatureCollectionAttr('fields', []);
			this.$('select.field-names').each(function() {
				var fieldType = $(this).attr('data-type'),
					opts = ['<option value="">(' + __('none') + ')</option>'];
				_.each(fields, function(field) {
					if (field.name.match(/^properties\./) && (!fieldType || fieldType == field.type)) {
						opts.push('<option value="%(name)s">%(label)s</option>'.format(field));
					}
				})
				$(this).html(opts.join('\n'));
			});
		},

	    populateFromModel: function()
	    {
			this.updateFromModel();
			this.populateFieldInputs();
			this.populateModelInputs();
			this.$('.panel-header .title').text(this.model.get('layerOptions.title'));
			this.populateColorSchemes();
			this.setButtonState(false, false);
			this.updateSliders();
	    },

	    getModelInputValues: function(values)
	    {
	    	var self = this,
	    		schemes = _.deepClone(this.model.get('layerOptions.colorSchemes')) || [{}];
	    	schemes[this.colorSchemeIndex].colors = this.getColorsFromTable();
	    	values['layerOptions.colorSchemes'] = schemes;
	    	values['layerOptions.colorSchemeIndex'] = this.colorSchemeIndex;
	    	return values;
	    },

	    undoButtonClicked: function(event) 
	    {
	    	this.colorSchemeIndex = this.savedModelAttributes.layerOptions.colorSchemeIndex || 0;
	    	this.model.setColorScheme(this.colorSchemeIndex);
	    	this.model.set(this.savedModelAttributes);
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
	    			self.populateFromModel();
	    		},
	    		error: function(model, xhr, options) {
			    	self.setButtonState(true);
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
	    	this.updateModel();
	    },

	    updateModel: function()
	    {
	    	this.setButtonState(this.isChanged);
	    	if (this.isPreviewEnabled()) { 
    			this.model.setColorScheme(this.colorSchemeIndex);
	    	}
	    	this.updateModelFromInputs({silent: !this.isPreviewEnabled()});
	    },

	    previewChanged: function(event) 
	    {
	    	if (this.isPreviewEnabled()) {
		    	this.updateModel();
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

	    setButtonState: function(state, animated) 
	    {
	    	if (state != undefined) {
		    	this.$('.btn.undo').attr('disabled', !state);
		    	this.$('.btn.save').attr('disabled', !state);
	    	}

	    	this.$('.remove-color').attr('disabled', this.$('.color-palette tbody tr').length < 2);

	    	if (this.$('.color-palette tbody tr').length <= 2) {
		    	this.$('.show-color-generator').attr('disabled', false);
	    	} else {
		    	this.$('.show-color-generator').attr('disabled', true);
	    	}
	    	this.hideColorGenerator();

	    	var duration = animated || animated == undefined ? 
	    		'fast' : null,
	    		showAdvanced = this.$('.show-advanced').is(':checked');

			this.$('.advanced').each(function() {
				if (!$(this).hasClass('feature-settings')) {
					if (showAdvanced) {
						$(this).show(duration);
					} else {
						$(this).hide(duration);
					}
				}
			});
	    	var featureType = this.getValueFromModelInput('layerOptions.featureType');
	    	this.$('.feature-settings').each(function() {
	    		var visible = $(this).hasClass(featureType) && 
	    			(showAdvanced || !$(this).hasClass('advanced'));
				if (visible) {
					$(this).show(duration);
				} else {
					$(this).hide(duration);
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

	    populateColorSchemes: function(toggle)
	    {
	    	var self = this,
	    		schemes = this.model.get('layerOptions.colorSchemes');
	    	this.$('.color-schemes .dropdown-menu .color-scheme').remove();
	    	var schemeItems = [];
	    	_.map(schemes, function(scheme, index) {
	    		schemeItems.push('<li class="color-scheme"><a class="toggle-color-scheme" data-index="' 
	    			+ index + '" href="#">' + scheme.name + '</a></li>');
	    	})
	    	this.$('.color-schemes .dropdown-menu').append(schemeItems.join('\n'));
	    	if (toggle || toggle == undefined) {
		    	this.toggleColorScheme();
	    	}
	    	this.$('.delete-color-scheme').toggle(
	    		schemes != undefined && schemes.length > 1);
	    	this.$('.color-scheme').toggle(
	    		schemes != undefined && schemes.length > 0);
	    },

	    addColorScheme: function(event)
	    {
	    	event.preventDefault();
	    	var self = this,
	    		schemes = this.model.get('layerOptions.colorSchemes'),
	    		newScheme = {
		    		name: __('color scheme %(i)s', {i: schemes ? schemes.length + 1 : 1}),
		    		colors: [{
		    			color: DEFAULT_COLOR_EDITOR_COLOR,
		    			position: DEFAULT_COLOR_EDITOR_POSITION
		    		}]
		    	};
	    	if (schemes) {
		    	schemes.push(newScheme);
	    	} else {
	    		schemes = [newScheme];
	    		this.model.set({'layerOptions.colorSchemes': schemes}, {silent: true});
	    	}
	    	this.colorSchemeIndex = schemes.length - 1;
	    	this.populateColorSchemes();
			this.modelInputChanged();
	    	this.$('.color-scheme-name').select().focus();
	    },

	    deleteColorScheme: function()
	    {
	    	event.preventDefault();
	    	var self = this,
	    		schemes = this.model.get('layerOptions.colorSchemes');
	    	if (schemes.length < 2) return;
	    	schemes.splice(this.colorSchemeIndex, 1);
	    	this.colorSchemeIndex = 0;
	    	this.populateColorSchemes();
			this.modelInputChanged();
	    },

	    colorSchemeNameChanged: function(event) 
	    {
	    	var input = $(event.currentTarget),
	    		scheme = this.getCurrentColorScheme();
	    	if (input.val() == '') {
	    		input.val(scheme.name);
	    	} else {
	    		scheme.name = input.val();
	    		this.modelInputChanged();
	    		this.populateColorSchemes(false);
	    	}
	    },

	    getCurrentColorScheme: function()
	    {
	    	return this.model.get('layerOptions.colorSchemes')[this.colorSchemeIndex];
	    },

	    populateColorTable: function(colors) 
	    {
	    	var self = this;
	    	this.$('.color-palette tbody').empty();
	    	var colors = colors || 
	    		this.getCurrentColorScheme().colors;
	    	for (var i = 0; i < colors.length; i++) {
				var row = this.addColorRow(colors[i]);
	    	}
	    },

	    toggleColorScheme: function(event)
	    {
	    	var self = this,
	    		schemes = this.model.get('layerOptions.colorSchemes');
	    	if (event) {
	    		this.getCurrentColorScheme().colors = this.getColorsFromTable();
	    		this.colorSchemeIndex = $(event.currentTarget).attr('data-index');
	    		event.preventDefault();
	    	}
	    	var scheme = this.model.getColorScheme(this.colorSchemeIndex),
	    		schemeItems = this.$('.color-schemes .dropdown-menu .color-scheme');
	    	schemeItems.removeClass('inactive');
	    	$(schemeItems[this.colorSchemeIndex]).addClass('inactive');
	    	this.$('.color-scheme-name').val(scheme.name);
	    	this.populateColorTable(scheme.colors);
	    	this.setButtonState();
	    	if (event) {
	    		this.modelInputChanged();
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

	    importExportClicked: function(event) 
	    {
	    	var opts = _.extend({}, this.model.getLayerOptions());
	    	for (var k in opts) {
	    		if (k[0] == '_') delete opts[k];
	    	}
			this.$('textarea[name=settings-json]').val(JSON.stringify(opts));
	    	this.$('.import-settings').attr('disabled', true);
	    },

	    importSettingsChanged: function(event)
	    {
	    	try {
		    	var parse = JSON.parse(this.$('textarea[name=settings-json]').val());
	    	} catch(e) {
	    	}
	    	self.$('.import-settings').attr('disabled', !parse);			
	    },

	    importSettingsClicked: function(event)
	    {
	    	this.$('.import-export').popover('hide');
	    	var saved = _.deepClone(this.model.attributes);
	    	this.model.setLayerOptions(JSON.parse(this.$('textarea[name=settings-json]').val()));
	    	this.populateFromModel();
	    	this.setButtonState(true, false);
	    	this.isChanged = true;
	    	this.savedModelAttributes = saved;
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
