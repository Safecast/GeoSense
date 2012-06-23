window.DataInfoView = Backbone.View.extend({

    tagName: 'div',
	className: 'data-info',
	
    events: {
    },

    initialize: function(options) {
    	
	    this.template = _.template(tpl.get('data-info'));	
		this.vent = options.vent;
		this.responseData = null;
		this.dataTitle = '';
		this.dataColor = '#ffffff';

		_.bindAll(this, "showDetailData");
	 	options.vent.bind("showDetailData", this.showDetailData);
		_.bindAll(this, "hideDetailData");
	 	options.vent.bind("hideDetailData", this.hideDetailData);
    },

    compileDetailDataForModel: function(pointCollectionId, model)
    {
		var mapLayer = app.getMapLayer(pointCollectionId);
		var pointCollection = mapLayer.pointCollection;

		var val = model.get('val');
		var altVal = model.get('altVal');
		var label = model.get('label');
		var datetime = model.get('datetime');
		var count = model.get('count');
		var maxDate = new Date(datetime.max).format(mapLayer.options.datetimeFormat || locale.formats.DATE_SHORT);
		var minDate = new Date(datetime.min).format(mapLayer.options.datetimeFormat || locale.formats.DATE_SHORT);

		var data = [];

		if (minDate) {
			var formattedDate = minDate != maxDate ? __('%(minDate)s–%(maxDate)s', {
					minDate: minDate,
					maxDate: maxDate
				}) : minDate;
		} else {
			var formattedDate = '';
		}

		if (label) {
			data.push({
				label: label.min + '<br />' + formattedDate
			});
		} else {
			data.push({
				label: formattedDate
			});
		}

		data.push({
			label: pointCollection.unit, 
			value: formatDecimalNumber(val.avg, 3)
		});

		if (altVal) {
			for (var i = 0; i < altVal.length; i++) {
				data.push({
					label: pointCollection.altUnit[i], 
					value: formatDecimalNumber(altVal[i], 3)
				});
			}
		}

		var metadata = pointCollection.reduce ? [
			{
				label: __('# of samples'),
				value: count
			}
		] : [];
		if (count > 1) {
			metadata = metadata.concat([
				{
					label: __('peak', {
						unit: pointCollection.unit
					}),
					value: formatDecimalNumber(val.max, 3)
				}, 
				{
					label: __('minimum', {
						unit: pointCollection.unit
					}),
					value: formatDecimalNumber(val.min, 3)
				}, 
				{
					label: __('average', {
						unit: pointCollection.unit
					}),
					value: formatDecimalNumber(val.avg, 3)
				} 
			]);
		}

		return {
			data: data,
			metadata: metadata
		};
    },

    showDetailData: function(pointCollectionId, model)    
	{	
		var obj = this.compileDetailDataForModel(pointCollectionId, model);
		var legend = this.$('.data-legend.'+pointCollectionId);

		var getRow = function(o) {
			if (o.label && o.value != null) {
				return '<tr><th class="value-label">' + o.label + '</th><td class="value">' + o.value + '</td></tr>';
			} else if (o.label) {
				return '<tr><td colspan="2" class="value-label single"><h5>' + o.label + '</h5></td></tr>';
			} else {
				return '<tr><td colspan="2" class="value single">' + o.value + '</td></tr>';
			}
		};

		var table = $('.detail-data', legend);
		var items = '';
		for (var i = 0; i < obj.data.length; i++) {
			items += getRow(obj.data[i]);
		} 	
		table.html(items);

		var table = $('.detail-metadata', legend);
		var items = '';
		for (var i = 0; i < obj.metadata.length; i++) {
			items += getRow(obj.metadata[i]);
		} 	
		table.html(items);

		var collapsible = $('.collapse', legend);
		// hide first to prevent flicker
		collapsible.collapse('hide');
		collapsible.collapse('show');
		this.$('.data-legend .collapse').each(function() {
			if (this != collapsible[0]) {
				$(this).collapse('hide');
			}
		});

	},

    hideDetailData: function(pointCollectionId)
	{	
		var legend = this.$('.data-legend.'+pointCollectionId);
		var collapsible = $('.collapse', legend);
		collapsible.collapse('hide');
	},

    render: function() {
		$(this.el).html(this.template());
		var self = this;

		$(this.el).draggable({

			stop: function() {
				var right = $(this).position().left + $(this).outerWidth();				
				if (right == $('.snap.right').position().left) {
					console.log('snap back 1');
					// re-dock to right edge
					$(this).css('left', 'auto');
				}
			},

			snap: ".snap", snapMode: "outer"
		});
		$(this.el).css('position', 'absolute'); // draggable sets it to relative
		this.$('a.extend').click(function() {
			$(self.el).toggleClass('extended');
			self.vent.trigger('dataInfoViewResized');
			return false;
		})
		this.$('a.collapse').click(function() {
			self.$('.accordion').toggle('fast');
			return false;
		})

        return this;
    },

});