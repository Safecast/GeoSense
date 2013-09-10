define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/legend.html'
], function($, _, Backbone, config, utils, templateHtml) {
    "use strict";

	var LegendView = Backbone.View.extend({

		className: 'legend',
		autoHide: true,
	    events: {
	    	'click .unit-toggle': 'unitToggleClicked',
	    	'click .color-scheme-trigger': function(event) { event.preventDefault(); }
	    },

	    initialize: function(options) 
	    {
	    	this.template = _.template(templateHtml);
		    this.listenTo(this.model, 'toggle:valFormatter', this.valFormatterChanged);
		    this.listenTo(this.model, 'toggle:colorScheme', this.colorSchemeChanged);
		    this.listenTo(this.model.featureCollection, 'reset', this.countsChanged);
			this.hasBeenVisible = false;
			this.autoHide = options.autoHide != undefined ? options.autoHide : this.autoHide;
	    },

	    unitToggleClicked: function(event)
	    {
			this.model.setValFormatter(parseInt($(event.currentTarget).attr('data-index')));
			event.preventDefault();
	    },

	    countsChanged: function(event)
	    {
	    	if (this.model.getOption('attrMap', {}).featureColor == 'count') {
				this.updateColorBarLabels();
	    	}
	    },

	    valFormatterChanged: function(model)
	    {
			var li = this.$('.unit ul li');
			li.removeClass('active');
			if (this.model.getValFormatters().length > 1) {
				$(li[this.model.sessionOptions.valFormatterIndex]).addClass('active');
			}
			this.updateColorBarLabels();
	    },

	    colorSchemeToggleClicked: function(event)
	    {
			this.model.setColorScheme(parseInt($(event.currentTarget).attr('data-index')));
			event.preventDefault();
	    },

	    colorSchemeChanged: function(model)
	    {
	    	this.render();
	    },

	    removePopover: function()
	    {
			if (this.colorSchemeTrigger) {
		    	this.colorSchemeTrigger.popover('hide');
			}

			// TODO the above has no effect when rerendering, hence
	    	$('.popover').remove();
	    },

	    getDisplayUnit: function(valFormatter)
	    {
	    	if (this.isDisplayingCounts()) {
	    		return this.model.getDisplay('itemTitlePlural');
	    	}
	    	if (!valFormatter) {
	    		valFormatter = this.model.getValFormatter();
	    	}
	    	return valFormatter.unit;
	    },

		render: function()
		{	
			var self = this,
				layerOptions = this.model.getLayerOptions();
			$(this.el).html(this.template());

			this.removePopover();

			var valFormatter = this.model.getValFormatter(),
				unit = this.getDisplayUnit(valFormatter),
				schemes = this.model.getLayerOptions().colorSchemes,
				scheme = this.model.getColorScheme();

			if (unit) {
				var formatItems = [],
					formatters = this.model.getValFormatters(),
					ul = this.$('.unit ul'),
					hasToggleFormatters = !this.isDisplayingCounts() && formatters.length > 1,
					num = hasToggleFormatters ? formatters.length : 1;
				ul.html('');
				for (var i = 0; i < num; i++) {
					var f = formatters[i];
					var li = '<li class="unit-item' 
						+ (hasToggleFormatters && f == valFormatter ? ' active' : '') 
						+ '">'
						+ (hasToggleFormatters ? '<a href="#" class="unit-toggle" data-index="' + 
							i + '">' : '<span>')
						+ '<strong>' + this.getDisplayUnit(f) + '</strong>'
						+ (hasToggleFormatters ? '</a>' : '</span>')
						+ '</li>';
					var li = $(li);
					ul.append(li);
				}
				
				this.$('.unit').show();
			} else {
				this.$('.unit').hide();
			}

			var colorSchemePopover = this.$('.color-scheme-popover').remove();
			if (schemes && schemes.length > 1) {
				var ul = this.$('.unit ul');
			    var schemeItems = schemes.map(function(scheme, index) {
			    	return '<li><a href="#" class="color-scheme-toggle" data-index="' + index + '">'
			    		+ scheme.name + '</a></li>';
			    });
				ul.append('<li><a href="#" class="color-scheme-trigger has-popover" data-placement="bottom"><i class="glyphicon glyphicon-adjust"></i> <span class="caret"></span></a>');
				this.colorSchemeTrigger = this.$('.color-scheme-trigger');

				$('.color-schemes', colorSchemePopover).append(schemeItems.join('\n'));
				this.$('.unit').show();

				this.colorSchemeTrigger.popover({
					animation: false,
					content: function() {
						$('.color-scheme-toggle', colorSchemePopover).each(function(index) {
							$(this).toggleClass('active', index == self.model.sessionOptions.colorSchemeIndex);
						});
						return colorSchemePopover.html();
					},
					html: true,
					title: __('Color Schemes') 
				}).on('shown.bs.popover', function() {
					$('.color-scheme-toggle').click(function(event) {
						self.colorSchemeTrigger.popover('hide');
						return self.colorSchemeToggleClicked(event);
					});
				});
			}

			if (this.$('.color-bar').length) {
				var items = [],
					colors = this.model.getNormalizedColors();
				var labelColor = layerOptions.colorLabelColor && layerOptions.colorLabelColor.length ?
					layerOptions.colorLabelColor : null,
					colorsW = 100; // %

				for (var i = 0; i < colors.length; i++) {
					var baseColor = colors[i].color,
						darkerColor = multRGB(baseColor, .95),
						channels = getRGBChannels(labelColor || baseColor),
						invert = rgb2hsb(channels)[2] < .5,
						invert = labelColor ? !invert : invert;
					
					items.push( 
						'<li style="width: ' + Math.round(colorsW / colors.length * 100) / 100 + '%;">'
						+ '<div class="segment' + (invert ? ' inverted' : '') + '" style="background: '+baseColor+';'
						+ 'background: linear-gradient(top, ' + baseColor + ' 40%, ' + darkerColor + ' 80%);'
						+ 'background: -webkit-gradient(linear, left top, left bottom, color-stop(.4, '+baseColor+'), color-stop(.8, '+darkerColor+'));'
						+ (labelColor ? ' color: ' + labelColor + ';' : '')
						+ '">'
						+ '</div>'
						+ '</li>'
					);
				}

				this.$('.color-bar').html(items.join(''));
				this.updateColorBarLabels();
			}
			return this;
		},

		isDisplayingCounts: function()
		{
			return this.model.getOption('attrMap', {}).featureColor == 'count';
		},

		updateColorBarLabels: function()
		{
			if (!this.$('.color-bar').length) return;

			var valFormatter = this.model.getValFormatter(),
				colors = this.model.getNormalizedColors(),
				isGradient = colors.length > 1, //&& (colorType == ColorType.LINEAR_GRADIENT || this.colorType == ColorType.PALETTE);
				segments = this.$('.color-bar .segment'),
				hasNumbers = false;

			for (var i = 0; i < colors.length; i++) {
				var val,
					maxIndex,
					isNumeric = this.model.isNumeric(),
					isCounts = this.isDisplayingCounts(),
					hasCountsGtZero = false,
					counts = this.model.featureCollection.getCounts(),
					mag = !counts ? 0 : counts.max > 10000 ? 1000	
						: counts.max > 100 ? 100
						: 1,
					extremes = this.model.getMappedExtremes(),
					minVal = extremes.numeric ? extremes.numeric.min : NaN,
					maxVal = extremes.numeric ? extremes.numeric.max : NaN,
					numAttr = this.model.attrMap ? this.model.attrMap.numeric : null;

				if (colors[i].label != undefined) {
					val = colors[i].label;
				} else {
					if (isCounts) {
						if (counts && counts.max) {
							val = colors[i].position * counts.max;
							if (val < 1) {
								val = 1;
							} else {
								if (val > mag) {
									val = Math.round(val / mag) * mag;								
								}
								val = autoFormatNumber(val);
							}
							hasCountsGtZero = true;
						} else {
							val = '&nbsp;';
						}
					} else if (!isNumeric || (colors[i].title && colors[i].title.length)) {
						val = colors[i].title || '&nbsp;';
					} else {
						hasNumbers = true;
						if (isGradient) {
							val = valFormatter.format(
								minVal + colors[i].position * (maxVal - minVal));
							if (maxIndex == undefined || colors[i].position > colors[maxIndex].position) {
								maxIndex = i;
							}
						} else {
							val = '%(min)s – %(max)s'.format({
								min: valFormatter.format(minVal),
								max: valFormatter.format(maxVal)
							});
						}
					}
				}

				$(segments[i]).html(val);
			}

			if (maxIndex != undefined && colors[maxIndex].position < 1.0) {
				$(segments[maxIndex]).append('+');
			}

			if (isCounts) {
				if (hasCountsGtZero) {
					this.$el.show('fast');
					this.hasBeenVisible = true;
				} else if (this.autoHide) {
					this.$el.hide(this.hasBeenVisible ? 'fast' : null);
				}
			} else {
				this.hasBeenVisible = false;
			}
		}

	});

	return LegendView;
});