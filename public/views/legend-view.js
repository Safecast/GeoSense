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
	    	'click .unit-toggle': 'unitToggleClicked'
	    },

	    initialize: function(options) 
	    {
	    	this.template = _.template(templateHtml);
		    this.listenTo(this.model, 'toggle:valFormatter', this.valFormatterChanged);
	    },

	    unitToggleClicked: function(event)
	    {
			this.model.setValFormatter(parseInt($(event.currentTarget).attr('data-index')));
			return false;
	    },

	    valFormatterChanged: function(model)
	    {
			var li = this.$('.unit ul li');
			li.removeClass('active');
			$(li[this.model.sessionOptions.valFormatterIndex]).addClass('active');
			this.updateColorBarLabels();
	    },

		render: function()
		{	
			var self = this,
				layerOptions = this.model.attributes.layerOptions;
			$(this.el).html(this.template());

			var valFormatter = this.model.getValFormatter(),
				unit = valFormatter.unit;

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

			if (this.$('.color-bar').length) {
				var items = [],
					colors = this.model.getNormalizedColors();
				var labelColor = layerOptions.colorLabelColor && layerOptions.colorLabelColor.length ?
					layerOptions.colorLabelColor : null;
				for (var i = 0; i < colors.length; i++) {
					var baseColor = colors[i].color,
						darkerColor = multRGB(baseColor, .85),
						channels = getRGBChannels(labelColor || baseColor),
						invert = (channels[0] + channels[1] + channels[2]) < COLOR_BAR_INVERT_CUTOFF * 3,
						invert = labelColor ? !invert : invert;
					
					items.push( 
						'<li style="width: ' + Math.round(100 / colors.length * 100) / 100 + '%;">'
						+ '<div class="segment' + (invert ? ' inverted' : '') + '" style="background: '+baseColor+';'
						+ 'background: linear-gradient(top, ' + baseColor + ' 40%, ' + darkerColor + ' 80%);'
						+ 'background: -webkit-gradient(linear, left top, left bottom, color-stop(.4, '+baseColor+'), color-stop(.8, '+darkerColor+'));'
						+ (labelColor ? ' color: '+labelColor+';' : '')
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
						val = valFormatter.format(extremes.minVal) 
							+ '–' 
							+ valFormatter.format(extremes.maxVal);
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