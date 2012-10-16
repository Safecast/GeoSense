window.DataInfoView = window.PanelViewBase.extend({

	className: 'panel data-info',
	
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

		_.bindAll(this, "toggleValFormatter");
	 	this.vent.bind("toggleValFormatter", this.toggleValFormatter);

	 	this.visibleDetailModels = {};
    },

    compileDetailDataForModel: function(pointCollectionId, model)
    {
		var mapLayer = app.getMapLayer(pointCollectionId);
		var pointCollection = mapLayer.pointCollection;

		var val = model.get('val');
		var isAggregate = val && val.avg != null;
		var altVal = model.get('altVal');
		var label = model.get('label');
		var datetime = model.get('datetime');
		var count = model.get('count');
		var maxDate = new Date(isAggregate ? datetime.max : datetime).format(mapLayer.options.datetimeFormat || locale.formats.DATE_SHORT);
		var minDate = new Date(isAggregate ? datetime.min : datetime).format(mapLayer.options.datetimeFormat || locale.formats.DATE_SHORT);

		var valFormatter = mapLayer.sessionOptions.valFormatter;

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
			label: valFormatter.unit, 
			value: valFormatter.format(isAggregate ? val.avg : val)
		});

		/*
		TODO: Fix with formatters
		if (altVal) {
			for (var i = 0; i < altVal.length; i++) {
				var altValFormat = mapLayer.options.altValFormat.length > i ?
					mapLayer.options.altValFormat[i] : null;
				data.push({
					label: altValFormat && altValFormat.unit ? altValFormat.unit : pointCollection.altUnit[i], 
					value: formatVal(altVal[i], altValFormat)
				});
			}
		}
		*/

		var metadata = pointCollection.reduce ? [
			{
				label: __('# of samples'),
				value: formatLargeNumber(count)
			}
		] : [];
		if (count > 1) {
			metadata = metadata.concat([
				{
					label: __('peak', {
						unit: pointCollection.unit
					}),
					value: valFormatter.format(val.max)
				}, 
				{
					label: __('minimum', {
						unit: pointCollection.unit
					}),
					value: valFormatter.format(val.min)
				}, 
				{
					label: __('average', {
						unit: pointCollection.unit
					}),
					value: valFormatter.format(val.avg)
				} 
			]);
		}

		return {
			data: data,
			metadata: metadata
		};
    },

    showDetailData: function(pointCollectionId, model, panelAnimation)    
	{
		panelAnimation = panelAnimation || panelAnimation == undefined;
		this.visibleDetailModels[pointCollectionId] = model;

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

		if (panelAnimation) {
			this.setPanelState(true);	
			var collapsible = $('.collapse', legend);
			$('.detail', collapsible).show();
			// hide first to prevent flicker
			collapsible.collapse('hide');
			collapsible.collapse('show');
			this.$('.data-legend .collapse').each(function() {
				if (this != collapsible[0]) {
					$(this).collapse('hide');
					$('.detail', this).hide();
				}
			});
		}
	},

    hideDetailData: function(pointCollectionId)
	{
		this.visibleDetailModels[pointCollectionId] = null;

		var legend = this.$('.data-legend.'+pointCollectionId);
		var collapsible = $('.collapse', legend);
		$('.detail', collapsible).hide();
		//collapsible.collapse('hide');

		/*
		if (this.$('.data-legend .detail:visible').length == 0) {
			this.$('.data-legend .collapse').each(function() {
				$(this).collapse('show');
			});
		}
		*/
	},

    toggleValFormatter: function(mapLayer, formatter)
    {	
    	var pointCollectionId = mapLayer.pointCollection._id;
		if (this.visibleDetailModels[pointCollectionId]) {
			this.showDetailData(pointCollectionId, this.visibleDetailModels[pointCollectionId], false);
		}
	}	

});