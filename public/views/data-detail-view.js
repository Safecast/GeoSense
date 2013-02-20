define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/data-detail.html',
	'views/panel-view-base'
], function($, _, Backbone, config, utils, templateHtml, PanelViewBase) {
	var DataDetailView = PanelViewBase.extend({

		className: 'panel data-detail',
		
	    events: {
	    },

	    initialize: function(options) 
	    {
	    	DataDetailView.__super__.initialize.call(this, options);
		    this.template = _.template(templateHtml);	
	    },

	    setModel: function(model)
	    {
	    	if (this.model) {
	    		this.stopListening(this.model);
	    	}
	    	this.model = model;
	    	this.populateFromModel();
	    	this.listenTo(model.collection.mapLayer, 
	    		'toggle:valFormatter', this.populateFromModel);
	    },

	    populateFromModel: function()    
		{
			var model = this.model,
				obj = this.compileDetailDataForModel(model) || {data: {}, metadata: {}},
				body = this.$('.panel-body');

			var getRow = function(o) {
				if (o.label && o.value != null) {
					return '<tr><th class="value-label">' + o.label + '</th><td class="value">' + o.value + '</td></tr>';
				} else if (o.label) {
					return '<tr><td colspan="2" class="value-label single"><h5 class="box">' + o.label + '</h5></td></tr>';
				} else if (o.value != undefined) {
					return '<tr><td colspan="2" class="value single">' + o.value + '</td></tr>';
				} else if (o.body != undefined) {
					return '<tr><td colspan="2" class="body"><div class="meta box">' + o.body + '</div></td></tr>';
				}
				return '';
			};

			var table = $('.detail-data', body),
				items = '';
			for (var i = 0; i < obj.data.length; i++) {
				items += getRow(obj.data[i]);
			} 	
			table.html(items);
			table.toggle(items != '');

			var table = $('.detail-metadata', body),
				items = '';
			for (var i = 0; i < obj.metadata.length; i++) {
				items += getRow(obj.metadata[i]);
			} 	
			table.html(items);
			table.toggle(items != '');
		},

	    compileDetailDataForModel: function(model)
	    {
	    	if (!model.collection) return;
	    	var mapLayer = model.collection.mapLayer,
				pointCollection = mapLayer.pointCollection,
				layerOptions = mapLayer.getLayerOptions(),
				valFormatter = mapLayer.getValFormatter(),
				val = model.get('val'),
				altVal = model.get('altVal'),
				label = model.get('label'),
				datetime = model.get('datetime'),
				count = model.get('count'),
				description = model.get('description'),
				description = description ?
					typeof(description) == 'object' ? description.min : description : null,
				maxDateFormatted, minDateFormatted;

			this.$('.model-title').text(mapLayer.getDisplay('title'));

			if (datetime) {
				var maxDate = typeof(datetime) == 'object' ? datetime.max : datetime;
				var minDate = typeof(datetime) == 'object' ? datetime.min : datetime;

				maxDateFormatted = maxDate ? 
					new Date(maxDate).format(layerOptions.datetimeFormat || locale.formats.DATE_SHORT) : null;
				minDateFormatted = minDate ? 
					new Date(minDate).format(layerOptions.datetimeFormat || locale.formats.DATE_SHORT) : null;
			}

			var data = [];

			if (minDateFormatted) {
				var formattedDate = minDateFormatted != maxDateFormatted ? __('%(minDate)s–%(maxDate)s', {
						minDate: minDateFormatted,
						maxDate: maxDateFormatted
					}) : minDateFormatted;
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

			if (mapLayer.isNumeric()) {
				data.push({
					label: valFormatter.unit, 
					value: valFormatter.format(typeof(val) == 'object' ? val.avg : val)
				});
			}

			if (description && description.length) {
				data.push({
					body: description
				});
			}

			var metadata = mapLayer.attributes.pointCollection.reduce ? [
				{
					label: __('no. of ') + (layerOptions.itemTitlePlural || 'samples'),
					value: formatLargeNumber(count)
				}
			] : [];
			if (count > 1) {
				metadata = metadata.concat([
					{
						label: __('peak', {
							unit: valFormatter.unit
						}),
						value: valFormatter.format(val.max)
					}, 
					{
						label: __('minimum', {
							unit: valFormatter.unit
						}),
						value: valFormatter.format(val.min)
					}, 
					{
						label: __('average', {
							unit: valFormatter.unit
						}),
						value: valFormatter.format(val.avg)
					} 
				]);
			}

			return {
				data: data,
				metadata: metadata
			};
	    }

	});

	return DataDetailView;
});
