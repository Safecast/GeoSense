window.DataViewBase = Backbone.View.extend({

    tagName: 'div',
	className: 'data-inspector',
	
    events: {
		'click #removeData:' : 'removeDataClicked',
		'click #editData:' : 'editDataClicked',
		'click #updateData' : 'updateDataClicked',

		'click .color-type:' : 'colorTypeChanged',
		'click .feature-type:' : 'featureTypeChanged',
		'click .legend-button:' : 'visibilityChanged',
		'click .visibility:' : 'visibilityChanged',
		
		'click #colorInput' : 'colorInputClicked',

		'click .visibility': 'visibilityChanged'
    },

    initialize: function(options) 
    {
		this.vent = options.vent;
	    this.template = _.template(tpl.get('data-inspector'));
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

		if (!this.mapLayer.sessionOptions.visible) return;

		var stateIndicator = this.$('.state-indicator');
		if (stateIndicator.length) {
			switch (type) {
				default:
					stateIndicator.stop().fadeIn(0);
					stateIndicator.addClass('loading');
					this.$('.visibility.toggle').stop().fadeTo(0, 0);
					break;
				case 'complete':
					stateIndicator.stop().fadeOut(300, function() {
						stateIndicator.removeClass('loading');
					});
					this.$('.visibility.toggle').stop().fadeTo(300, 1.0);
					break;
			}
		}
	},

    updateStatus: function() 
    {
    	var status = '';
		var progress = this.mapLayer.pointCollection.progress;
    	switch (this.mapLayer.pointCollection.status) {
    		case DataStatus.COMPLETE:
    			if (this.mapLayer.sessionOptions.visible) {
	    			if (this.collection.originalCount != undefined) {
						status = __('%(number)i of %(total)i', {
							number: formatLargeNumber(this.collection.originalCount),
							total: formatLargeNumber(this.collection.fullCount)
						});
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
    			var percent = Math.floor(progress / this.mapLayer.pointCollection.numBusy * 100);
    			status = __(progress ? 'crunching… %(percent)s%' : 'crunching…', {
    				percent: percent
    			});
    			this.$('.progress .bar').css('width', percent + '%');
    			this.$('.progress').show();
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

		this.updateStatus();

		this.$(".title").html(dataTitle);
		this.$(".accordion-toggle").attr("href", "#collapse-" + this.className + '-' + this.mapLayer.pointCollection._id);
		this.$(".collapse").attr("id", "collapse-" + this.className + '-' + this.mapLayer.pointCollection._id);

		console.log('updateToggleState', 'bla');

		this.$(".collapse").on('show', function() {
			self.updateToggleState(true);
		});
		this.$(".collapse").on('hide', function() {
			self.updateToggleState(false);
		});

		if (!app.isMapAdmin()) {
			this.$('#adminDataControls').remove();
		}
		
		this.setParameters();
		if (!this.visible) {
			this.$(".collapse").collapse('hide');
		}
		this.updateToggleState();
	
        return this;
    },

	initHistogram: function()
	{	
		var self = this;
		var graphEl = self.$('.histogram');

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
		var maxVal = self.mapLayer.pointCollection.maxVal;
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

		var gradient = new ColorGradient(this.histogramColors || this.colors, 'threshold');

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

		this.colors = options.colors;
		this.colorType = options.colorType;
		this.featureType = options.featureType;
		this.visible = options.visible;
		this.visibilityChanged();

		for (var k in options) {
			var input = this.$('[name='+k+']');
			if (input.length) {
				input.val(options[k]);
				input.change(function() {
				});
			}
		}

		$(this.el).delegate('input, select', 'change', function() {
			self.enableUpdateButton();
		});

		if (this.mapLayer.pointCollection.status == DataStatus.COMPLETE) {
			this.updateLegend(true);
		}

		console.log('disableUpdateButton');
		this.disableUpdateButton();
	},

	removeDataClicked: function(evt)
	{
		var self = this;
		$(this.el).fadeOut('fast');
		self.collection.reset();
		self.collection.unbindCollection();

		if (evt) evt.preventDefault();
   	},

	updateDataClicked: function(evt)
	{
		//build json and update
		var self = this;
		//this.collection.unbindCollection();
				
		switch (this.colorType) {
			case ColorType.SOLID:
				this.colors = [{color: this.$('#colorInput').val()}];
				break;
			case ColorType.PALETTE:
				this.colors = this.getColorsFromPaletteEditor();
		}
		
		var postData = {
			visible: this.visible,
			colorType: this.colorType,
			colors: this.colors,
			featureType: this.featureType,
			opacity: this.$('[name=opacity]').val(),
			title: this.$('[name=title]').val(),
			description: this.$('[name=description]').val(),
			unit: this.$('[name=unit]').val(),
			altUnit: this.$('[name=altUnit]').val()
		};

		console.log('postData', postData);
		
		$.ajax({
			type: 'POST',
			url: '/api/updatemapcollection/' + app.mapInfo._id + '/' + this.mapLayer.pointCollection._id,
			dataType: 'json',
			data: postData,
			success: function(data) {
				self.disableUpdateButton();
				self.updateLegend(true);
				self.vent.trigger('updateMapLayer', data);
			},
			error: function() {
				console.error('failed to update layer options');
			}
		});	
			
		if (evt) evt.preventDefault();
	},

	editDataClicked: function(evt)
	{
		var self = this;
		
		if(this.editDataView)
			this.editDataView.remove();
			
		this.editDataView = new EditDataView({vent: this.vent, collection:this.collection});
        $('body').append(this.editDataView.render().el);
		$('#editDataModal').modal('toggle');

		if (evt) evt.preventDefault();
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
			this.initHistogram();
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

		for (var i = 0; i < this.colors.length; i++) {
			var val;
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

			$(segments[i]).text(val);
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

	enableUpdateButton: function()
	{
		console.log('enableUpdateButton');
		this.$('#updateData').attr('disabled', false);
		this.$('#updateData').removeClass('disabled');
		this.$('#updateData').addClass('btn-primary');
	},
	
	disableUpdateButton: function()
	{
		this.$('#updateData').attr('disabled', true);
		this.$('#updateData').removeClass('btn-primary');
		this.$('#updateData').addClass('disabled');
	},

	colorInputClicked: function(evt)
	{
		this.enableUpdateButton();
		if (evt) evt.preventDefault();
	},
	
	featureTypeChanged: function(evt)
	{
		var self = this;
		if (evt) {
			var val = $(evt.currentTarget).val();
			if (val == this.colorType) return;
			this.featureType = val;
			this.enableUpdateButton();
		}

		this.$('.feature-type').each(function() {
			if ($(this).val() == self.featureType) {
				$(this).addClass('active');
			} else {
				$(this).removeClass('active');
			}
		});

		this.$('.feature-settings').each(function() {
			if ($(this).hasClass(self.featureType)) {
				$(this).show();
			} else {
				$(this).hide();
			}
		});

		if (evt) evt.preventDefault();
	},

	colorTypeChanged: function(evt)
	{
		var self = this;
		if (evt) {
			var val = $(evt.currentTarget).val();
			if (val == this.colorType) return;
			this.colorType = val;
			this.enableUpdateButton();
		}

		this.$('.color-type').each(function() {
			if ($(this).val() == self.colorType) {
				$(this).addClass('active');
			} else {
				$(this).removeClass('active');
			}
		});

		switch (this.colorType) {
			case ColorType.SOLID: 
				this.$('.color-gradient').hide();
				this.$('.color-palette').hide();
				this.$('.color-solid').show();
				this.updateLegend(true);
				break;
			case ColorType.LINEAR_GRADIENT: 
			  	this.$('.color-gradient').show();
				this.$('.color-palette').hide();
				this.$('.color-solid').hide();
				this.updateLegend(true);
			  	break;
			case ColorType.PALETTE: 
			  	this.$('.color-gradient').hide();
				this.$('.color-palette').show();
				this.$('.color-solid').hide();
				this.updateLegend(true);
			  	break;
		}

		if (evt) evt.preventDefault();
	},

	toggleLayerVisibility: function(pointCollectionId, state)
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
		} else {
			this.$('.icon.visibility.toggle').removeClass('icon-eye-open');
			this.$('.icon.visibility.toggle').addClass('icon-eye-close');
		}

		this.updateStatus();
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
			this.enableUpdateButton();
			this.vent.trigger("toggleLayerVisibility", this.mapLayer.pointCollection._id, this.visible);
		} else {
			this.toggleLayerVisibility(this.mapLayer.pointCollection._id, this.visible);
		}
		this.updateLegend();
		if (evt) evt.preventDefault();
	}

});