define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/data-import.html',
	'views/modal-view'
], function($, _, Backbone, config, utils, templateHtml, ModalView) {
	var DataImportView = ModalView.extend({

	    tagName: 'div',
		className: 'data-import-view modal fade',
		
	    events: {
			'click #importButton': 'importButtonClicked',
			'click .from-field .remove' : 'fromFieldRemoveClicked',
	    },

	    initialize: function(options) {
		    this.template = _.template(templateHtml);	
			this.vent = options.vent;
			this.responseData = null;
			this.dataTitle = '';
			this.dataDescription = '';
	    },

	    render: function() {
	    	var self = this;

			$(this.el).html(this.template());
			var self = this;
			this.$('.modal').addClass('large');

			this.fromFieldTemplate = this.$('.from-data thead .element-template');
			this.toFieldTemplate = this.$('.to-data thead .element-template');
			this.$('.element-template').remove();
			
			this.fromFieldColors = ['#A52A2A', '#f89406', '#46a546', '#62cffc', '#87CEEB', '#FF7F50', '#DAA520', '#B8860B', '#c43c35', '#556B2F'];
			this.fromFields = {
				'Facility': 'Facility',
				'location':'location',
				'blank': 'blank',
				'month': 'month',
				'Longitude': 'Longitude', 
				'Latitude': 'Latitude',
				'Captured Time': 'Captured Time',
				'Value': 'Value',
				'day': 'day',
				'Process': 'Process',
				'val':'val',
				'Current Status':'Current Status',
				'year':'year',
				'Owner':'Owner',
				'Country':'Country',
				'ISO country code':'ISO country code'

			};

			this.toFields = {
				'loc': 'Point X,Y',
				'val': 'Point Value',
				'datetime':'Date',
				'label': 'Point Label',
				'attributes': 'Attributes'
			};

			var i = 0;
			for (var k in this.fromFields) {
				var f = this.fromFieldTemplate.clone();
				f.removeClass('element-template');
				$('.field-name', f).text(k);
				$('.label', f).css('background-color', this.fromFieldColors[i % this.fromFieldColors.length]);
				$('.from-field', f).attr('data-from', k);
				this.$('.from-data thead').append(f).show();
				i++;
			}

			var initClickHandler = function(f) {
				$('.show-field-settings', f).hide();
				// solve with popover
				/*$('.show-field-settings', f).click(function() {
					$('.field-settings', f).toggle();
					return false;
				});*/
			};

			for (var k in this.toFields) {
				var f = this.toFieldTemplate.clone();
				f.removeClass('element-template');
				$('.field-title', f).text(this.toFields[k]);
				$('.to-field', f).attr('data-to', k);
				$('.field-settings', f).hide();
				initClickHandler(f);
				this.$('.to-data thead').append(f).show();
			}

			this.$('.to-field').sortable({
				connectWith: '.to-field',
				stop: function(event, ui) {
					// prevent double loading since dropping from draggable into the sortable
					// will also fire this event, but draggable.stop fires later than this one.
					if (self.preventSortableEvents) return;
					self.loadImportPreview();
				}
			});

			this.$('.from-field').draggable({
				revert: "invalid",
				helper: "clone",
				connectToSortable: '.to-field',
				stack: '.drag.label',
				start: function(event, ui) {
					self.preventSortableEvents = true;
					$(ui.helper).removeClass('half-opacity');
					self.$('.to-field').addClass('highlight');
				},
				stop: function(event, ui) {
					self.preventSortableEvents = false;
					self.$('.to-field').removeClass('highlight');
					self.$('.to-data .from-field').removeClass('half-opacity');
					self.updateHandleStates();
					self.loadImportPreview();
				}
			});

			this.spinner = this.$('.spinner').html(new Spinner({radius:5,length:0,width:5,color:'#333',lines:7,speed:1.5}).spin().el).hide();
					
			/*this.$('.drop-field').droppable( {
		      accept: '.drag-field',
		      hoverClass: '',
		      drop: self.handleCardDrop
		    } );*/
				
	        return this;
	    },

	    updateHandleStates: function()
	    {
	    	var self = this,
	    		mapped = this.$('.to-data .from-field');
	    	this.$('.from-data .from-field').each(function() {
	    		for (var i = 0; i < mapped.length; i++) {
	    			if ($(mapped[i]).attr('data-from') == $(this).attr('data-from')) {
		    			$(this).addClass('half-opacity');
		    			return;
	    			}
	    		}
    			$(this).removeClass('half-opacity');
	    	});
	    },

	    fromFieldRemoveClicked: function(event) {
			$(event.currentTarget).closest('.from-field').remove();
			this.updateHandleStates();
			this.loadImportPreview();
			return false;
	    },

	    setAlert: function(html) {
	    	if (!html) {
				this.$('.modal-body .alert').hide();
	    	} else {
				this.$('.modal-body .alert').show();
				this.$('.modal-body .alert').html(html);
	    	}
	    },

	    getFieldDefs: function() 
	    {
			var defs = {},
				valid = false;
			for (var k in this.toFields) {
				//console.log(this.$('.to-field[data-to=' + k +'] .from-field'));
				var fromFields = this.$('.to-field[data-to=' + k +'] .from-field'),
					def = {
						fromFields: []
					};
				for (var i = 0; i < fromFields.length; i++) {
					def.fromFields.push($(fromFields[i]).attr('data-from'));
				}
				if (def.fromFields.length) {
					defs[k] = def;
					valid = true;
				}
			}

			var errors = [];
			
			// move validation to server
			/*if (!defs.loc.fromFields.length) {
				errors.push('Point X,Y is required');
			}*/

			return {fieldDefs: defs, errors: errors, valid: valid};
	    },
		
		importButtonClicked: function() {
			if (this.isLoading) return false;
			this.runImport({background: true});
			return false;
		},
		
		runImport: function(params, options)
		{
			var self = this;
			var defs = this.getFieldDefs(),
				fieldDefs = defs.fieldDefs || [],
				options = options || {};

			if (defs.errors.length) {
				if (!options.silent) {
					this.setAlert('<ul><li>' + defs.errors.join('</li></li>') + '</li></ul>');
				}
				if (!params.preview) {
					return false;
				}
			}

			if (!defs.valid && params.preview) {
				self.updateImportPreview([]);
				return;
			}

			console.log('Requesting import', params);
			this.setAlert();
			this.setLoading(true);
			$.ajax({
				type: 'POST',
				url: '/api/import/',
				data: _.extend({
					url: 'https://dl.dropbox.com/s/03cqpv1camzz4a1/reactors.csv',
					//url: 'https://dl.dropbox.com/s/rhggvuijnbbxk8r/earthquakes.csv',
					//url: 'https://api.safecast.org/system/measurements.csv',
					fields: fieldDefs,
				}, params),
				success: function(responseData) {
					self.setLoading(false);
					//app.bindCollectionToMap(responseData.pointCollectionId);
					//$('#addDataModal').modal('hide');
					if (params.preview) {
						self.updateImportPreview(responseData.items);
					} else {
						app.saveNewMapLayer(responseData.collection._id);
						self.close();
					}
				},
				error: function(jqXHR, textStatus, errorThrown) {
					self.setLoading(false);
					var data = $.parseJSON(jqXHR.responseText);
					console.error('import failed', data.errors);
					var lis = '';
					if (data && data.errors) {
						for (var k in data.errors) {
							lis += '<li>' + data.errors[k].message + '</li>';
						}
						if (!options.silent) {
							self.setAlert('<ul>' + lis + '</ul>');
						}
					}
					self.$('#importButton').attr('disabled', false);
					if (params.preview) {
						self.updateImportPreview([]);
					}
				}
			});
		},

		setLoading: function(isLoading)
		{
			this.isLoading = isLoading;
			this.$('#importButton').attr('disabled', isLoading);
			if (isLoading) {
				this.spinner.show();
			} else {
				this.spinner.hide();
			}
		},

		loadImportPreview: function()
		{
			this.runImport({preview: true, max: 30}, {silent: true});
		},

		updateImportPreview: function(items)
		{
			var self = this;
			var rows = items.reduce(function(rows, current) {
				var row = ''
				if (current) {
					for (var k in self.toFields) {
						var val = undefined, tdclass = undefined;
						if (typeof current[k] == 'object' && current[k].error) {
							tdclass = 'conversion-error';
							switch (current[k].name){
								case 'ValueSkippedError':
									val = 'skipped';
									break;
								default:
									val = 'error';
							}
						} else {
							switch (k) {
								default:
									val = current[k];
									break;
								case 'datetime':
									if (current[k]) {
										val = new Date(current[k]);
										if (val) {
											val = val.format(locale.formats.DATE_TIME);
										}
									}
							}
							if (val == undefined || 
								((typeof val == 'string' || Array.isArray(val)) && !val.length)) {
									tdclass = 'conversion-blank';
									val = 'blank';
							}
						}
						row += '<td' + (tdclass ? ' class="' + tdclass + '"' : '') + '>' + val + '</td>';
					}
				}
				rows.push('<tr>' + row + '</tr>');
				return rows;
			}, []);
			this.$('.to-data tbody').html(rows.join(''));
		}
		
/*		showDataReview: function(data)
		{
			var self = this;
			
			this.$('#dataButton').hide();
			this.$('#dataConfirmButton').show();
			
			this.$('.modal').addClass('large');
			this.$('.modal-body .add').fadeOut(function(){
				self.$('.modal-body .review').fadeIn(function(){
					
					$('.data-import-view .modal-body .review .data-table').append('<table class="table table-striped table-bordered table-condensed"></table>');

					var table;
					for(var i = 0; i < 50; ++i) // 50 or data.length
					{
						table += "<tr>";

						$.each(data[i], function(key, val) { 
							table += '<td rel="tooltip" title="'+key+'" class="tooltip-test">' + val + '</td>';
						});

						table += "</tr>";				
					}

					$('.data-import-view .modal-body .review .data-table .table').append(table);
						
				});	
			});
		},*/

	});

	return DataImportView;
});
