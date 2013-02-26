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
	    	'change .step.source input': 'sourceInputChanged',
			'click .import-run': 'importButtonClicked',
			'click .source-submit': 'sourceSubmitButtonClicked',
			'click .back': 'backButtonClicked',
			'click .from-field .remove' : 'fromFieldRemoveClicked',
	    },

	    initialize: function(options) {
		    this.template = _.template(templateHtml);	
			this.vent = options.vent;
			this.responseData = null;
			this.dataTitle = '';
			this.dataDescription = '';
			this.maxPreview = 30;
			this.inspectedSource;
			this.fromFieldColors = ['#a52a2a', '#f89406', '#46a546', '#62cffc', '#ff7f50', '#87ceeb', '#daa520', '#b8860b', '#c43c35', '#556b2f'];

			this.toFields = {
				'geometry.coordinates': 'Point X,Y',
				'properties.val': 'Point Value',
				'properties.datetime':'Date',
				'properties.label': 'Point Label',
				//'properties.mixed': 'Mixed'
			};
	    },

	    canImport: function()
	    {
	    	return !this.isLoading 
	    		&& this.$('input[name=url]').val().length;
	    },

	    sourceSubmitButtonClicked: function() 
	    {
	    	var self = this;
	    	if (!this.canImport()) return false;
	    	console.log('sourceSubmit');
			this.runImport({inspect: true, max: this.maxPreview}, {
				success: function(responseData) {
					if (responseData.items && responseData.items.length) {
						self.initSourceForMapping(responseData);
						self.setStep('mapping');
					}
				}
			});
			return false;
	    },

	    backButtonClicked: function() 
	    {
	    	this.setStep('source');
	    },

	    sourceInputChanged: function() 
	    {
	    	var prev = this.$('input[name=url]').data('prevVal'),
	    		cur = this.$('input[name=url]').val();
	    	this.$('input[name=url]').data('prevVal', cur);
	    	if (1/*!prev || !prev.length*/) { // TODO detect a 100% change
	    		cur = cur.replace(/^https:\/\/www.dropbox.com\//, 
	    			'https://dl.dropbox.com/');
	    		this.$('input[name=url]').val(cur);
	    	}
	    	this.$('.btn.source-submit').attr('disabled', !this.canImport());
	    },

		importButtonClicked: function() 
		{
			var self = this;
			if (!this.canImport()) return false;
			this.runImport({background: true}, {
				success: function(responseData) {
					app.saveNewMapLayer(responseData.collection._id);
					self.setStep('source');
					self.close();
				}
			});
			return false;
		},

		initSourceForMapping: function(data) 
		{
			var self = this;
			this.inspectedSource = data;
			this.fromFields = {};
			_.each(this.inspectedSource.items[0], function(value, key) {
				self.fromFields[key] = key;
			});

			this.$('.from-data thead').empty();
			this.$('.from-data tbody').empty();
			this.$('.to-data thead').empty();
			this.$('.to-data tbody').empty();

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

			// add source row preview
			_.each(this.inspectedSource.items, function(row) {
				var tds = '';
				_.each(self.fromFields, function(tmp, key) {
					tds += '<td>' + row[key] + '</td>';
				});
				self.$('.from-data tbody').append('<tr>' + tds + '</tr>');
			});

			var initClickHandler = function(f) {
				$('.show-field-settings', f).hide();
				// solve with popover
				/*$('.show-field-settings', f).click(function() {
					$('.field-settings', f).toggle();
					return false;
				});*/
			};

			this.updateHandleStates();

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

		},

	    render: function() 
	    {
	    	var self = this;

			$(this.el).html(this.template());
			var self = this;

			this.spinner = this.$('.spinner').html(new Spinner({radius:6,length:0,width:6,color:'#333',lines:7,speed:1.5}).spin().el).hide();

			this.setStep('source');					

			if (DEV) {
				this.$('[name=url]').val('https://dl.dropbox.com/s/cb4blktkkelwg1n/nuclear_reactors.csv');
				self.sourceSubmitButtonClicked();
			}

			this.sourceInputChanged();

			this.fromFieldTemplate = this.$('.from-data thead .element-template');
			this.toFieldTemplate = this.$('.to-data thead .element-template');
			this.$('.element-template').remove();

			this.$("input.text").click(function() {
			   $(this).select();
			});

	        return this;
	    },

	    setStep: function(step)
	    {
	    	this.setAlert();
	    	this.$('.step').each(function() {
	    		$(this).toggle($(this).is('.' + step));
	    	});
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
	    	this.$('.target').toggleClass('mapped', mapped.length > 0);
	    },

	    fromFieldRemoveClicked: function(event) {
			$(event.currentTarget).closest('.from-field').remove();
			this.updateHandleStates();
			this.previousFieldDefs = null;
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
				var fromFields = this.$('.to-field[data-to="' + k +'"] .from-field'),
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
	
		runImport: function(params, options)
		{
			var self = this,
				defs, fieldDefs,
				options = options || {};

			if (!params.inspect) {
				defs = this.getFieldDefs();
				fieldDefs = defs.fieldDefs || [];

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
			}

			this.previousFieldDefs = fieldDefs;

			var params = _.extend({
				url: this.$('input[name=url]').val(),
				fields: fieldDefs,
			}, params);
			console.log('Requesting import', params);
			this.setAlert();
			this.setLoading(true);
			if (this.request) {
//				this.request.abort();
			}
			this.request = $.ajax({
				type: 'POST',
				url: '/api/import/',
				data: params,
				success: function(responseData) {
					console.log('import response', responseData);
					self.setLoading(false);
					if (params.preview) {
						self.updateImportPreview(responseData.items);
					}
					if (options.success) {
						options.success(responseData);
					}
				},
				error: function(jqXHR, textStatus, errorThrown) {
					self.setLoading(false);
					var data = $.parseJSON(jqXHR.responseText),
						errors = data && data.errors ? data.errors : data.error ? {'': data} : null;
					console.error('import failed', errors);
					var lis = '';
					if (errors) {
						for (var k in errors) {
							lis += '<li><i class="icon icon-ban-circle"></i> ' + errors[k].message + '</li>';
						}
						if (!options.silent) {
							self.setAlert('<ul>' + lis + '</ul>');
						}
					}
					if (params.preview) {
						self.updateImportPreview([]);
					}
					if (options.error) {
						options.error(responseData);
					}
				}
			});
		},

		setLoading: function(isLoading)
		{
			this.isLoading = isLoading;
			this.$('.import-run').attr('disabled', isLoading);
			this.$('.source-submit').attr('disabled', isLoading);
			if (isLoading) {
				this.spinner.show();
			} else {
				this.spinner.hide();
			}
		},

		loadImportPreview: function()
		{
			if (this.previousFieldDefs && _.isEqual(this.previousFieldDefs, this.getFieldDefs().fieldDefs)) return;
			this.runImport({preview: true, max: this.maxPreview}, {silent: true});
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
								case 'ValueSkippedWarning':
									val = current[k].message;
									break;
								default:
									val = current[k].message;
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
		
	});

	return DataImportView;
});
