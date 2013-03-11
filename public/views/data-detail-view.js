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
	    	
	    	this.defaultLayout = [
	    		{fields: ['properties.label', '%(datetime)s'], label: false, class: "box title"},
	    		{fields: ['%(numeric)s'], label: '%(numeric)s', class: 'large'},
	    		{fields: ['properties.description'], label: false, class: 'box text-body muted'},
	    		{fields: ['properties.$other'], label: '%(field)s', class: 'text-body muted'},

	    		{fields: ['count'], label: __('no. of %(itemTitlePlural)s'), class: 'muted'},
	    		{fields: ['%(numeric)s.max'], label: 'peak', class: 'muted'},
	    		{fields: ['%(numeric)s.min'], label: 'minimum', class: 'muted'},
	    		{fields: ['%(numeric)s.avg'], label: 'average', class: 'muted'}
	    	];
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
			this.$('.model-title').text(this.model.collection.mapLayer.getDisplay('title'));
		},

	    compileDetailDataForModel: function(model)
	    {
	    	if (!model.collection) return;
	    	var mapLayer = model.collection.mapLayer,
				layerOptions = mapLayer.getLayerOptions(),
				layout = mapLayer.getDisplay('detailLayout') || this.defaultLayout,
				valFormatter = mapLayer.getValFormatter(),
				displayedFields = {};

			var isEmpty = function(value) {
				return (typeof value == 'object' && _.isEmpty(value)) 
					|| (!value && value != 0) || value === '';
			};

			var getValue = function(value, format) {
				if (typeof value != 'object') return format ? format(value) : value;
				return value.avg ? getValue(value.avg, format) :
					__('%(min)s – %(max)s').format({
						min: getValue(value.min, format),
						max: getValue(value.max, format)
					});
			};

			var formatDate = function(value) {
				return new Date(value).format(layerOptions.datetimeFormat || locale.formats.DATE_SHORT);
			};

			var fieldSubst = !layerOptions.attrMap ? {} : {
				'numeric': layerOptions.attrMap.numeric,
				'datetime': layerOptions.attrMap.datetime,
				'label': layerOptions.attrMap.label
			};

			var labelSubst = {
				'numeric': !isEmpty(valFormatter.unit) ? valFormatter.unit : 
					(fieldSubst.numeric ? mapLayer.attributes.featureCollection.fields.reduce(function(a, b) {
						if (b.name == fieldSubst.numeric) return b.label;
						return a;
					}) : __('Value')),
				'unit': valFormatter.unit,
				'itemTitlePlural': mapLayer.getDisplay('itemTitlePlural') || __('samples')
			};

			var rows = [];

			_.each(layout, function(row) {
				var content = [];
				var addToContent = function(content, fieldName, field) {
					var value = model.get(fieldName),
							format = false;
					displayedFields[fieldName] = true;
					if (!isEmpty(value)) {
						switch (field.split('.')[0]) {
							case '%(datetime)s': 
								format = formatDate;
								break;
							case '%(numeric)s':
								format = valFormatter.format;
								break; 
						};
						content.push(getValue(value, format));
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
								addRow(addToContent([], 'properties.' + key, field), {
									label: row.label ? row.label.format(_.extend(fieldSubst, {field: key})) : false,
									class: row.class
								});
							}
						});
					} else {
						addToContent(content, fieldName, field);
					}
				});
				addRow(content, row);

			});

			return rows;
	    }

	});

	return DataDetailView;
});
