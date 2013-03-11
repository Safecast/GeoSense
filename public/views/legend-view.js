define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/legend.html'
], function($, _, Backbone, config, utils, templateHtml) {

	var LegendView = Backbone.View.extend({

		className: 'legend',
	    events: {
	    	'click .unit-toggle': 'unitToggleClicked',
	    	'click .color-scheme-trigger': function(event) { event.preventDefault(); }
	    },

	    initialize: function(options) 
	    {
	    	this.template = _.template(templateHtml);
		    this.listenTo(this.model, 'toggle:valFormatter', this.valFormatterChanged);
		    this.listenTo(this.model, 'toggle:colorScheme', this.colorSchemeChanged);
	    },

	    unitToggleClicked: function(event)
	    {
			this.model.setValFormatter(parseInt($(event.currentTarget).attr('data-index')));
			event.preventDefault();
	    },

	    valFormatterChanged: function(model)
	    {
			var li = this.$('.unit ul li');
			li.removeClass('active');
			$(li[this.model.sessionOptions.valFormatterIndex]).addClass('active');
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
	    	$('.popover').remove();
	    	/*
	    	TODO: has no effect
			if (this.colorSchemeTrigger) {
		    	this.colorSchemeTrigger.popover('hide');
			}
			*/
	    },

		render: function()
		{	
			var self = this,
				layerOptions = this.model.attributes.layerOptions;
			$(this.el).html(this.template());

			var valFormatter = this.model.getValFormatter(),
				unit = valFormatter.unit,
				schemes = this.model.attributes.layerOptions.colorSchemes,
				scheme = this.model.getColorScheme();

			if (unit) {
				var formatItems = [];
				var formatters = this.model.getValFormatters();
				var ul = this.$('.unit ul');
				ul.html('');
				for (var i = 0; i < formatters.length; i++) {
					var f = formatters[i];
					var li = '<li class="unit-item' 
						+ (formatters.length > 1 && f == valFormatter ? ' active' : '') 
						+ '">'
						+ (formatters.length > 1 ? '<a href="#" class="unit-toggle" data-index="' + 
							i + '">' : '<span>')
						+ f.unit 
						+ (formatters.length > 1 ? '</a>' : '</span>')
						+ '</li>';
					var li = $(li);
					ul.append(li);
				}
				
				this.$('.unit').show();
			} else {
				this.$('.unit').hide();
			}

			var colorSchemePopover = this.$('.color-scheme-popover').remove();
			if (schemes.length > 1) {
				var ul = this.$('.unit ul');
			    schemeItems = schemes.map(function(scheme, index) {
			    	return '<li><a href="#" class="color-scheme-toggle" data-index="' + index + '">'
			    		+ scheme.name + '</a></li>';
			    });
				ul.append('<li><a href="#" class="color-scheme-trigger has-popover" data-placement="bottom"><i class="icon icon-white icon-adjust half-opacity"></i> <span class="caret"></span></a>');
				this.colorSchemeTrigger = this.$('.color-scheme-trigger');

				$('.color-schemes', colorSchemePopover).append(schemeItems.join('\n'));
				this.$('.unit').show();

				$('.has-popover', ul).popover({
					content: function() {
						$('.color-scheme-toggle', colorSchemePopover).each(function(index) {
							$(this).toggleClass('active', index == self.model.sessionOptions.colorSchemeIndex);
						});
						return colorSchemePopover.html();
					},
					html: true,
					container: 'body',
					title: __('Color Schemes') 
				}).on('shown', function() {
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
						darkerColor = multRGB(baseColor, .85),
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
					extremes = this.model.getMappedExtremes(),
					minVal = extremes.numeric ? extremes.numeric.min : NaN,
					maxVal = extremes.numeric ? extremes.numeric.max : NaN,
					numAttr = this.model.attrMap ? this.model.attrMap.numeric : null;

				if (!isNumeric || (colors[i].title && colors[i].title.length)) {
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

				$(segments[i]).html(val);
			}

			if (maxIndex != undefined && colors[maxIndex].position < 1.0) {
				$(segments[maxIndex]).append('+');
			}
		}

	});

	return LegendView;
});