define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/data-detail.html',
	'views/panel-view-base'
], function($, _, Backbone, config, utils, templateHtml, PanelViewBase) {
    "use strict";

	var DataDetailView = PanelViewBase.extend({

		className: 'panel data-detail',
		
	    events: {
	    },

	    initialize: function(options) 
	    {
	    	DataDetailView.__super__.initialize.call(this, options);
		    this.template = _.template(templateHtml);	
	    	
	    	this.defaultLayout = [
	    		{fields: ['properties.icon'], label: false, formatter: 'icon', class: 'icon muted'},
	    		{fields: ['%(label)s', '%(datetime)s'], label: false, class: "box title"},
	    		{fields: ['%(numeric)s'], label: '%(numeric)s', class: 'large'},
	    		{fields: ['properties.description'], label: false, class: 'box text-body muted'},
	    		{fields: ['properties.$other'], label: '%(field)s', class: 'text-body muted'},

	    		{fields: ['count'], label: __('no. of %(itemTitlePlural)s'), formatter: 'numeric', class: 'muted'},
	    		{fields: ['%(numeric)s.max'], label: __('peak'), class: 'muted'},
	    		{fields: ['%(numeric)s.min'], label: __('minimum'), class: 'muted'},
	    		{fields: ['%(numeric)s.avg'], label: __('average'), class: 'muted'},
	    		{fields: ['%(numeric)s.stddev'], label: __('std. deviation'), class: 'muted'}
	    	];
	    },

	    setModel: function(model)
	    {
	    	if (this.model) {
	    		this.stopListening(this.model);
	    		if (this.model.collection && this.model.collection.mapLayer)
	    			this.stopListening(this.model.collection.mapLayer);
	    	}
	    	this.model = model;
	    	this.populateFromModel();
	    	this.listenTo(model.collection.mapLayer, 
	    		'change', this.populateFromModel);
	    	this.listenTo(model.collection.mapLayer, 
	    		'toggle:valFormatter', this.populateFromModel);
	    },

	    populateFromModel: function()    
		{
			var model = this.model,
				rows = this.compileDetailDataForModel(model),
				body = this.$('.panel-body');

			var makeRow = function(o) {
				var span = o.class ? '<span class="' + o.class + '">' : '<span>';
				if (o.label != undefined && o.value != undefined) {
					return '<tr><th class="detail-label">' + span + o.label + '</span></th><td class="detail-value">' + span + o.value + '</span></td></tr>';
				} else if (o.label != undefined) {
					return '<tr><td colspan="2" class="detail-label single">' + span + o.label + '</span></td></tr>';
				} else if (o.value != undefined) {
					return '<tr><td colspan="2" class="detail-value single">' + span + o.value + '</span></td></tr>';
				}
				return '';
			};

			var table = $('.detail-data', body),
				tableRows = [];
			for (var i = 0; i < rows.length; i++) {
				tableRows.push(makeRow(rows[i]));
			} 	

			table.html(tableRows.join('\n'));
			if (this.model.collection && this.model.collection.mapLayer) {
				this.$('.model-title').text(this.model.collection.mapLayer.getDisplay('title'));
			}
		},

	    compileDetailDataForModel: function(model)
	    {
	    	if (!model.collection) return [];
	    	var mapLayer = model.collection.mapLayer,
				layerOptions = mapLayer.getLayerOptions(),
				layout = mapLayer.getDisplay('detailLayout') || this.defaultLayout,
				valFormatter = mapLayer.getValFormatter(),
				displayedFields = {};

			var isDate = function(value) {
				return value instanceof Date;
			};

			var isEmpty = function(value) {
				return !isDate(value)
					&& ((typeof value == 'object' && _.isEmpty(value)) 
					|| (!value && value != 0) || value === '');
			};

			var getValue = function(value, formatter) {
				if (isDate(value) || typeof value != 'object') return formatter ? formatter.format(value) : value;
				if (value.avg != undefined) return getValue(value.avg, formatter);
				if (Array.isArray(value)) {
					return value.join(', ');
				}
				if (value.min == value.max) return getValue(value.min, formatter);
				var minMax = formatter.minMaxFormat || __('%(min)s to %(max)s');
				return __(minMax).format({
						min: getValue(value.min, formatter),
						max: getValue(value.max, formatter)
					});
			};

			var formatters = {
				date: {
					format: function(value) {
						var value = value instanceof Date ? value : new Date(value);
						return value.format(layerOptions.datetimeFormat || locale.formats.DATE_SHORT);
					}
				},
				numeric: valFormatter,
				icon: {
					format: function(value) {
						return '<img class="icon" src="' + value + '" />';
					}
				}
			};

			formatters.icon.minMaxFormat = __('%(min)s %(max)s');
			formatters.date.minMaxFormat = formatters.numeric.minMaxFormat = __('%(min)s–%(max)s');

			var fieldSubst = !layerOptions.attrMap ? {} : {
				'numeric': layerOptions.attrMap.numeric,
				'datetime': layerOptions.attrMap.datetime,
				'label': layerOptions.attrMap.label
			};

			var fields = mapLayer.getFeatureCollectionAttr('fields');

			var labelSubst = {
				'numeric': !isEmpty(valFormatter.unit) ? valFormatter.unit : 
					(fieldSubst.numeric && fields ? fields.reduce(function(a, b) {
						if (b.name == fieldSubst.numeric) return b.label;
						return a;
					}) : __('Value')),
				'unit': valFormatter.unit,
				'itemTitlePlural': mapLayer.getDisplay('itemTitlePlural') || __('samples'),
			};

			var rows = [];

			_.each(layout, function(row) {
				var content = [];
				var addToContent = function(content, fieldName, field, row) {
					var value = model.get(fieldName),
						formatter = row.formatter ? formatters[row.formatter] : false;
					displayedFields[fieldName] = true;
					if (!formatter) {
						switch (field.split('.')[0]) {
							case '%(datetime)s': 
								formatter = formatters.date;
								break;
							case '%(numeric)s':
								formatter = formatters.numeric;
								break; 
						};
					}
					if (!isEmpty(value)) {
						content.push(getValue(value, formatter));
					}
					return content;
				};

				var addRow = function(content, row)
				{
					if (content.length) {
						var out = content.join(row.join || '<br />');
						if (row.label) {
							rows.push({label: row.label.format(labelSubst), value: out, class: row.class});
						} else {
							rows.push({value: out, class: row.class});
						}
					}
				}

				_.each(row.fields, function(field) {
					var fieldName = field.format(fieldSubst);
					if (fieldName == 'properties.$other') {
						_.each(model.get('properties'), function(value, key) {
							if (!displayedFields['properties.' + key]) {
								var r = {
									label: row.label ? row.label.format(_.extend(fieldSubst, {field: key})) : false,
									class: row.class,
									formatter: row.formatter
								}								
								addRow(addToContent([], 'properties.' + key, field, r), r);
							}
						});
					} else {
						addToContent(content, fieldName, field, row);
					}
				});
				addRow(content, row);

			});

			return rows;
	    }

	});

	return DataDetailView;
});
