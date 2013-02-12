define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'd3',
	'lib/color-gradient/color-gradient'
], function($, _, Backbone, config, utils, d3, ColorGradient) {
	var DataViewBase = Backbone.View.extend({

	    tagName: 'div',
		className: 'data-inspector',
		
	    events: {
			'click .visibility': 'visibilityChanged'
	    },

	    initialize: function(options) 
	    {
			this.vent = options.vent;
			this.title = options.mapLayer.pointCollection.title;
			this.collection = options.collection;
			this.mapLayer = options.mapLayer;
			
			this.colors = [];
			this.colorType = null;
			this.featureType = null;
			this.visible = true;
			
			this.collection.bind('add', this.addOne, this);
			this.collection.bind('reset', this.addAll, this);

			_.bindAll(this, "setStateType");
			this.vent.bind("setStateType", this.setStateType);

			_.bindAll(this, "toggleValFormatter");
		 	this.vent.bind("toggleValFormatter", this.toggleValFormatter);

			_.bindAll(this, "toggleLayerVisibility");
			options.vent.bind("toggleLayerVisibility", this.toggleLayerVisibility);
	    },

		setStateType: function(type, pointCollectionId) 
		{	
			if (!pointCollectionId || pointCollectionId != this.mapLayer.pointCollection._id) return;
			this.updateStatus();

			switch (this.mapLayer.pointCollection.status) {
				case DataStatus.COMPLETE:
					this.showLegend(true);
			}

			if (this.spinner) {
				switch (type) {
					default:
						this.spinner.stop().fadeIn(0);
						break;
					case 'complete':
						this.spinner.stop().fadeOut(300);
						break;
				}
			}
		},

	    updateStatus: function() 
	    {
	    	var status = '',
	    		countStatus = '',
				progress = this.mapLayer.pointCollection.progress;

	    	switch (this.mapLayer.pointCollection.status) {
	    		case DataStatus.COMPLETE:
	    			if (this.mapLayer.sessionOptions.visible) {
	    				if (this.collection.fetched) {
							status = __('%(number)i of %(total)i', {
								number: formatLargeNumber(this.collection.originalCount),
								total: formatLargeNumber(this.collection.fullCount)
							});
							var url = this.collection.url();
							status += ' <a target="_blank" class="download-collection ' + this.mapLayer.pointCollection._id +'" href="' 
								+ url + '"><span class="icon icon-white icon-download half-opacity"></span></a>';		
						} else {
		    				status = 'loading…';
						}
	    			} else {
	    				status = '';
	    			}
					break;
	    		case DataStatus.IMPORTING:
	    			status = __(progress ? 'importing… %(count)s' : 'importing…', {
	    				count: formatLargeNumber(this.mapLayer.pointCollection.progress)
	    			});
					break;
	    		case DataStatus.UNREDUCED:
	    		case DataStatus.UNREDUCED_INC:
	    			status = __('queued for crunching…');
					break;
	    		case DataStatus.REDUCING:
	    			if (this.mapLayer.pointCollection.numBusy) {
		    			var percent = Math.floor(progress / this.mapLayer.pointCollection.numBusy * 100);
		    			status = __(progress ? 'crunching… %(percent)s%' : 'crunching…', {
		    				percent: percent
		    			});
		    			this.$('.progress .bar').css('width', percent + '%');
		    			this.$('.progress').show();
	    			} else {
		    			status = __('crunching…', {
		    			});
	    			}
					break;
	    	}

	    	var el = this.$(".status");
	    	var currentText = el.text();
			if (status == '') {
				el.hide('fast');
			} else {
				el.show('fast');
			}
			el.html(status + (status == '' && currentText != '' ? '&nbsp;' : ''));
	    },

		updateToggleState: function(state) 
		{
			var self = this;
			if (state == undefined) {
				state = self.$(".collapse").is('.in');
			}
			if (state) {
				self.$('.icon.in-out').removeClass('out');
				self.$('.icon.in-out').addClass('in');
			} else {
				self.$('.icon.in-out').addClass('out');
				self.$('.icon.in-out').removeClass('in');
			}	
		},

	    render: function() 
	    {
			var self = this;
			$(this.el).html(this.template());
			this.$(".status").hide();
			$(this.el).addClass(this.mapLayer.pointCollection._id);
					
			if (this.title != '') {
				dataTitle = this.title;
			} else {
				dataTitle = "Untitled Data";
			}

			var stateIndicator = this.$('.state-indicator');
			if (stateIndicator.length) {
				this.spinner = stateIndicator.html(new Spinner({radius:4,length:0,width:4,color:'#eee',lines:7,speed:1.5}).spin().el).hide();
			}

			this.updateStatus();

			this.$(".title").html(dataTitle);

			// set attributes to link accordion toggle and body
			this.$(".accordion-toggle").attr("href", "#collapse-" + this.className + '-' + this.mapLayer.pointCollection._id);
			this.$(".collapse").attr("id", "collapse-" + this.className + '-' + this.mapLayer.pointCollection._id);

			this.$(".collapse").on('show', function(evt) {
				self.updateToggleState(true);
				if (!self.visible) {
					console.log('set to visible');
					self.visible = true;
					self.visibilityChanged();
				}
			});
			this.$(".collapse").on('hide', function() {
				self.updateToggleState(false);
			});

			if (!app.isMapAdmin()) {
				this.$('.admin-control').remove();
			}
			
			this.setParameters();
		
	        return this;
	    },

		initHistogram: function()
		{	
			var self = this;
			var graphEl = self.$('.histogram');
			graphEl.show();

			if (!graphEl.length) return;
			
			if (!this.histogramData) {
				$.ajax({
					type: 'GET',
					url: '/api/histogram/' + this.mapLayer.pointCollection._id,
					success: function(data) {
						self.histogramData = data;
						self.initHistogram();
					},
					error: function() {
						console.error('failed to fetch histogram');
					}
				});
				return;
			}

			var data = this.histogramData;
			var len = data.length;
			var maxVal = self.mapLayer.pointCollection.maxVal,
				minVal = self.mapLayer.pointCollection.minVal;
			var graphH = graphEl.innerHeight(),
				graphW = graphEl.innerWidth();

			var maxY = data[0].y,
				minY = data[0].y,
				croppedData = [], 
				yValues = [];
			for (var i = 1; i < len; i++) {
				maxY = Math.max(maxY, data[i].y);
				minY = Math.min(minY, data[i].y);
			}				

			var minY0 = (minY != 0 ? minY : 1);
			var yRatio = minY0 / maxY;

			var maxYRatio;
			if (self.mapLayer.options.cropDistribution) {
				maxYRatio = 1 / graphH * CROP_DISTRIBUTION_RATIO;
			}

			var cropMaxVal;
			/*
			var color = this.colors[this.colors.length - 1];
			if (color.absPosition) {
				cropMaxVal = color.absPosition;
			}*/

			var cropUpperMaxY = !maxYRatio || yRatio > maxYRatio ? 
				maxY : minY0 * 1 / maxYRatio;

			var yValues = [];


			var gradient = new ColorGradient(this.colors);

			var histMaxY;
			for (var i = 0; i < len; i++) {
				/*croppedData.push({
					x: data[i].x,
					y: Math.min(cropUpperMaxY, data[i].y)
				});*/
				if (cropMaxVal == null || data[i].val < cropMaxVal) {
					yValues.push(data[i].y);
				}
			}

			/*
			var graph = new Rickshaw.Graph({
				element: graphEl[0],
				renderer: 'bar',
				width: graphW, 
				height: graphH,
				series: [
					{
						data: croppedData,
						color: '#fff' 
					}
				]
			});

			graph.render();
			*/

			graphEl.html('');
			var chart = d3.select(graphEl[0]).append("svg")
			     .attr("class", "chart")
			     .attr("width", graphW)
			     .attr("height", graphH);

			var y = d3.scale.linear()
				.domain([minY, cropUpperMaxY])
				.range([0, graphH])
				.clamp(true);		     
			
			var barW = graphW / yValues.length;
			var maxX = yValues.length - 1;
			chart.selectAll("rect")
					.data(yValues)
				.enter().append("rect")
			    	.attr("x", function(d, i) { return i * barW; })
			    	.attr("y", function(d, i) { return graphH - y(d) })
			     	.attr("height", y)
			     	.attr("width", barW)
			     	.style("fill", function(d, x) {
			     		return gradient.colorAt(x / maxX);
			     	});

			graphEl.append('<span class="graph-max-y">' + cropUpperMaxY + '</span>');

			/*chart.selectAll("line")
			     .data(y.ticks(1))
			   .enter().append("line")
			     .attr("y1", y)
			     .attr("y2", y)
			     .attr("x1", 0)
			     .attr("x2", graphW)
			     .style("stroke", "#666");

			chart.selectAll(".rule")
		    	.data(y.ticks(1))
	   		.enter().append("text")
				.attr("class", "rule")
				.attr("x", 0)
				.attr("y", y)
				.attr("dy", -3)
				.attr("text-anchor", "middle")
				.text(function(d) { return d } );
			*/
		},

		setParameters: function()
		{
			var self = this;
			var options = this.mapLayer.options;

			this.colors = app.getMapLayer(this.mapLayer._id).getNormalizedColors();
			this.colorType = options.colorType;
			this.featureType = options.featureType;
			this.visible = options.visible;
			//this.visibilityChanged();

			for (var k in options) {
				var input = this.$('[name='+k+']');
				if (input.length) {
					input.val(options[k]);
					input.change(function() {
					});
				}
			}

			switch (this.mapLayer.pointCollection.status) {
				case DataStatus.COMPLETE:
				case DataStatus.UNREDUCED_INC:
					this.updateLegend(true);
					break;
				default:
					this.hideLegend();
			}

		},

		showLegend: function() 
		{
			this.$('.legend').show();
		},

		hideLegend: function() 
		{
			this.$('.legend').hide();
		},

		updateLegend: function(rebuildColorBar) 
		{
			var self = this;

			if (this.visible) {
				$(this.el).addClass('visible');
				$(this.el).removeClass('hidden');
			} else {
				$(this.el).removeClass('visible');
				$(this.el).addClass('hidden');
			}

			if (this.mapLayer.options.description) {
				this.$('.description').show();
				this.$('.description').html(this.mapLayer.options.description);
			} else {
				this.$('.description').hide();
			}

			if (this.mapLayer.pointCollection.source || this.mapLayer.pointCollection.sync) {
				this.$('.source').show();
				var source
					sourceLink = this.mapLayer.pointCollection.sourceUrl && this.mapLayer.pointCollection.sourceUrl != '' ?
						'<a href="%(sourceUrl)s">%(source)s</a>'.format(this.mapLayer.pointCollection) : this.mapLayer.pointCollection.source;
				if (this.mapLayer.pointCollection.source) {
					source = __('Source: %(source)s', {source: sourceLink});
				}
    			if (this.mapLayer.pointCollection.sync) {
					source += ' <span class="updated micro">(' + __('updated %(date)s', {
						date: new Date(
							this.mapLayer.pointCollection.reduce ? 
							(this.mapLayer.pointCollection.updatedAt < this.mapLayer.pointCollection.lastReducedAt || !this.mapLayer.pointCollection.lastReducedAt ?
								this.mapLayer.pointCollection.updatedAt : this.mapLayer.pointCollection.lastReducedAt) 
							: this.mapLayer.pointCollection.updatedAt)
								.format(locale.formats.DATE_SHORT)
					}) + ')</span>';
    			}
				this.$('.source').html(source);
			} else {
				this.$('.source').hide();
			}

			switch(this.colorType) {
				case ColorType.SOLID: 
					this.$('.legend-button').css('background-color', this.colors[0].color);
					break;
				case ColorType.PALETTE: 
				case ColorType.LINEAR_GRADIENT: 
					this.$('.legend-button').css('background-color', this.colors[0].color)	
					break;
			}

			for (t in FeatureType) {
				if (FeatureType[t] == this.featureType) {
					this.$('.legend-button').addClass(FeatureType[t]);
				} else {
					this.$('.legend-button').removeClass(FeatureType[t]);
				}
			}

			var valFormatter = this.mapLayer.sessionOptions.valFormatter;
			var unit = valFormatter.unit;

			var makeClickHandler = function(formatter) {
				return function(evt) {
					self.vent.trigger('toggleValFormatter', self.mapLayer, formatter);
					self.$('.unit-item').removeClass('active');
					$(evt.currentTarget).addClass('active');
					return false;
				}
			};

			if (unit) {
				var formatItems = [];
				var formatters = this.mapLayer.sessionOptions.valFormatters;
				var ul = this.$('.legend .unit ul');
				ul.html('');
				for (var i = 0; i < formatters.length; i++) {
					var f = formatters[i];
					var li = '<li class="unit-item' 
						+ (formatters.length > 1 && f == valFormatter ? ' active' : '') 
						+ '">'
						+ (formatters.length > 1 ? '<a href="#" class="unit-toggle">' : '<span>')
						+ f.unit 
						+ (formatters.length > 1 ? '</a>' : '</span>')
						+ '</li>';
					var li = $(li);
					if (formatters.length > 1) {
						li.on('click', makeClickHandler(f));
					}
					ul.append(li);
				}
				
				this.$('.legend .unit').show();
			} else {
				this.$('.legend .unit').hide();
			}

			if (rebuildColorBar && this.$('.color-bar').length) {
				if (this.mapLayer.options.histogram) {
					this.initHistogram();
				}
				var items = [];
				for (var i = 0; i < this.colors.length; i++) {
					var baseColor = this.colors[i].color;
					var darkerColor = multRGB(baseColor, .85);

					items.push( 
						'<li style="width: '+Math.round(100 / this.colors.length * 100) / 100+'%;">'
						+ '<div class="segment" style="background: '+baseColor
						+ '; background: linear-gradient(top, '+baseColor+' 40%, '+darkerColor+' 80%)'
						+ '; background: -webkit-gradient(linear, left top, left bottom, color-stop(.4, '+baseColor+'), color-stop(.8, '+darkerColor+'))'
						+ '">'
						+ '</div>'
						+ '</li>'
					);
				}
				this.$('.color-bar').html(items.join(''));
				this.setColorBarLabels();
			}
		},

	    toggleValFormatter: function(mapLayer, formatter)
	    {
	    	if (mapLayer != this.mapLayer) return;
	    	this.setColorBarLabels();
	    },

		setColorBarLabels: function()
		{
			var isGradient = this.colors.length > 1 
				&& (this.colorType == ColorType.LINEAR_GRADIENT || this.colorType == ColorType.PALETTE);
			var segments = this.$('.color-bar .segment');
			var valFormatter = this.mapLayer.sessionOptions.valFormatter;
			var hasNumbers = false;

			for (var i = 0; i < this.colors.length; i++) {
				var val;
				if (!this.colors[i].title) {
					hasNumbers = true;
					if (isGradient) {
						val = valFormatter.format(
							this.mapLayer.pointCollection.minVal + this.colors[i].position * 
							(this.mapLayer.pointCollection.maxVal - this.mapLayer.pointCollection.minVal));
						if (i == this.colors.length - 1 && this.colors[i].position < 1) {
							val += '+';
						}			
					} else {
						val = valFormatter.format(this.mapLayer.pointCollection.minVal) 
							+ '–' 
							+ valFormatter.format(this.mapLayer.pointCollection.maxVal);
					}
					if (i == 0) {
						val = UnitFormat.LEGEND.format({
							value: val, 
							unit: this.mapLayer.pointCollection.unit
						});
					}		
				} else {
					val = this.colors[i].title;
				}

				$(segments[i]).text(val);
			}

			if (!hasNumbers) {
				this.$('.legend .unit').hide();
			} else {
				this.$('.legend .unit').show();
			}
		},


		addOne: function(data) {
			var self = this;
	    },

	    addAll: function() {
		    /*var self = this;
			this.collection.each(function(data){ 
			self.addOne(data);
		 	});*/
			this.updateStatus();
	    },

		toggleLayerVisibility: function(pointCollectionId, state, hideCompletely)
		{	
			var self = this;
			if (pointCollectionId != this.mapLayer.pointCollection._id) return;
			this.visible = state;

			this.$('.visibility').each(function() {
				var val = $(this).val();
				val = Number(val) != 0;
				if (val == self.visible) {
					$(this).addClass('active');
				} else {
					$(this).removeClass('active');
				}
			});

			if (self.visible) {
				this.$('.icon.visibility.toggle').addClass('icon-eye-open');
				this.$('.icon.visibility.toggle').removeClass('icon-eye-close');
				$(this.el).show();
			} else {
				this.$('.icon.visibility.toggle').removeClass('icon-eye-open');
				this.$('.icon.visibility.toggle').addClass('icon-eye-close');
				if (hideCompletely) {
					$(this.el).hide();
				}
			}

			this.updateStatus();
			this.updateToggleState();
		},

		visibilityChanged: function(evt)
		{
			var self = this;
			if (evt) {
				if (!$(evt.currentTarget).hasClass('toggle')) {
					var val = $(evt.currentTarget).val();
					val = Number(val) != 0;
					if (val == this.visible) return;
					this.visible = val;
				} else {
					this.visible = !this.visible;
				}
			}
			this.vent.trigger("toggleLayerVisibility", this.mapLayer.pointCollection._id, this.visible);
			this.updateLegend();
			if (evt) evt.preventDefault();
		}

	});

	return DataViewBase;
});
