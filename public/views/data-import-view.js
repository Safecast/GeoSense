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
		className: 'data-import-view modal large fade',
		
	    events: {
	    	'change .step.source input': 'sourceInputChanged',
			'click .import-run': 'importButtonClicked',
			'click .source-submit': 'sourceSubmitButtonClicked',
			'click .back': 'backButtonClicked',
			'click .from-field .remove' : 'fromFieldRemoveClicked',
			'click .btn': function() { return false }
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

			this.defaultDescripts = [
				{to: 'geometry.coordinates', type: 'LatLng', label: 'coordinates', options: {}, allowedTypes: ['LatLng', 'LngLat']},
				{toTemplate: 'properties.$field', type: 'Number', label: '', options: {}},
				{toTemplate: 'properties.$field', type: 'String', label: '', options: {}},
				{toTemplate: 'properties.$field', type: 'Date', label: '', options: {}},
			];

			this.emptyDescript = {toTemplate: 'properties.$field', type: 'String', label: '', options: {}};

			this.fieldTypes = {
				"Number": "Number",
				"String": "Text",
				"Date": "Date",
				"Array": "List",
				"Object": "Object",
				"LatLng": "Lat,Lng",
				"LngLat": "Lng,Lat",
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
						self.initDataTransformForSource(responseData);
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

		initDataTransformForSource: function(data) 
		{
			var self = this;
			this.inspectedSource = data;
			this.fromFields = {};
			_.each(this.inspectedSource.items[0], function(value, key) {
				self.fromFields[key] = key;
			});
			console.log('initDataTransformForSource');
			this.descripts = _.deepClone(this.defaultDescripts);

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

			this.updateHandleStates();

			_.each(this.descripts, function(descript) {
				self.initDescript(descript);
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
					console.log('* draggable stop');
					self.preventSortableEvents = false;
					self.removePopover();

					self.$('.to-field').removeClass('highlight');
					self.$('.to-data .from-field').removeClass('half-opacity');
					self.updateHandleStates();

					self.updateDescripts();
					self.loadImportPreview();
				}
			});
		},

		initDescript: function(descript)
		{
			var self = this,
				container = self.toFieldTemplate.clone();
			container.removeClass('element-template');
			descript.dismiss = function()
			{
				$('.show-field-settings', container)
					//.attr('disabled', !descript.to)
					.popover('hide');
			};
			descript.updateContainer = function() {
				$('.field-label', container).text(descript.label);
				$('.field-type', container).text(self.fieldTypes[descript.type]);
			};
			descript.container = container;
			self.initDescriptSettings(descript);
			self.$('.to-data thead').append(container).show();
			descript.updateContainer();
			$('.to-field', container).sortable({
				connectWith: '.to-field',
				start: function(event, ui) {
				},
				stop: function(event, ui) {
					if (self.preventSortableEvents) return;
					self.removePopover();
					console.log('* sortable stop');
					// prevent double loading since dropping from draggable into the sortable
					// will also fire this event, but draggable.stop fires later than this one.
					self.updateDescripts();
					self.loadImportPreview();
				}
			});
		},

		initDescriptSettings: function(descript) 
		{
			var self = this,
				el = $('.field-settings', descript.container).remove();

			$('select.field-type', el).each(function() {
				var select = $(this),
					allowedTypes = descript.allowedTypes || _.keys(self.fieldTypes);
				_.each(allowedTypes, function(type) {
					select.append('<option value="' + type + '">' + self.fieldTypes[type] + '</option>');
				});
			});

			$('.show-field-settings', descript.container).popover({
				title: 'Transform',
				content: el,
				html: true,
				container: 'body'
			}).on('shown', function(evt) {
				$(this).addClass('active');
				var trigger = this;

				$('.field-setting', el).each(function() {
					if ($(this).attr('type') == 'checkbox') {
						$(this).attr('checked', getAttr(descript, $(this).attr('name')));
					} else {
						$(this).val(getAttr(descript, $(this).attr('name')));
					}
				});

				$('.field-setting', el).change(function() {
					setAttr(descript, $(this).attr('name'), 
						$(this).attr('type') == 'checkbox' ? $(this).is(':checked') : $(this).val());
					self.updateDescripts();
					self.loadImportPreview();
				});

				self.$('.show-field-settings').each(function() {
					if (this != trigger) {
						$(this).popover('hide');
					}
				});

			}).on('hidden', function(evt) {
				$(this).removeClass('active');
				return false;
			}).click(function(evt) {
				return false;
			});
		},

		updateDescripts: function()
		{
			var validDescripts = [];
			_.each(this.descripts, function(descript) {
				descript.from = [];
				var fromFields = $('.from-field', descript.container);
				descript.from = [];
				for (var j = 0; j < fromFields.length; j++) {
					descript.from.push($(fromFields[j]).attr('data-from'));
				}
				if (!descript.from.length) {
				 	if (descript.toTemplate) {
						descript.to = null;
						descript.label = '';					
					}
				} else {
					if (!descript.to && descript.toTemplate) {
						descript.to = descript.toTemplate.replace('$field', descript.from[0].replace(/\./g,' '));
						descript.label = descript.to;
					}
					validDescripts.push({
						to: _.clone(descript.to),
						from: _.clone(descript.from),
						options: _.clone(descript.options),
						type: _.clone(descript.type)
					});
				}
				descript.updateContainer();
			});

			if (validDescripts.length >= this.descripts.length - 1) {
				var newDescript = _.clone(this.emptyDescript);
				this.descripts.push(newDescript);
				this.initDescript(newDescript)
			}

			return validDescripts;
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

	    removePopover: function() 
	    {
			_.each(this.descripts, function(descript) {
				descript.dismiss();
			});
	    },

	    detach: function()
	    {
	    	this.removePopover();
			return DataImportView.__super__.detach.call(this);
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
			this.previousValidDescripts = null;
			this.updateDescripts();
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
	
		runImport: function(params, options)
		{
			var self = this,
				options = options || {},
				validDescripts;

			if (!params.inspect) {
				validDescripts = this.updateDescripts();				
				if (!validDescripts.length && params.preview) {
					self.updateImportPreview([]);
					return;
				}
			}

			if (options.ifChanged && this.previousValidDescripts && _.isEqual(this.previousValidDescripts, validDescripts)) {
				return;
			}
			this.previousValidDescripts = validDescripts;

			var params = _.extend({
				url: this.$('input[name=url]').val(),
				transform: validDescripts,
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
			this.runImport({preview: true, max: this.maxPreview}, {silent: true, ifChanged: true});
		},

		updateImportPreview: function(items)
		{
			var self = this;
			var rows = items.reduce(function(rows, current) {
				var row = ''
				if (current) {
					_.each(self.descripts, function(descript) {
						var out, tdclass, val, isError;
						if (descript.to) {
							val = getAttr(current, descript.to);
							isError = typeof val == 'object' && val.error;
							if (isError) {
								tdclass = 'conversion-error';
								switch (val.name){
									case 'ValueSkippedWarning':
										out = val.message;
										break;
									default:
										out = val.message;
								}
							} else {
								switch (descript.type) {
									default:
										out = val;
										break;
									case 'Date':
										if (val) {
											out = new Date(val);
											if (out) {
												out = out.format(locale.formats.DATE_TIME);
											}
										}
								}
							}
						}

						var isTransformed = descript.to && descript.to.length;
						if (isTransformed && (out == undefined ||
							((typeof out == 'string' || Array.isArray(out)) && !out.length))) {
								tdclass = 'conversion-blank';
								out = 'blank';
						} else if (!isError) {
							if (isTransformed) {
								out = '<i class="icon icon-ok-circle half-opacity"></i> ' + out;
							} else {
								out = '&nbsp;';
							}
						}

						row += '<td' + (tdclass ? ' class="' + tdclass + '"' : '') + '>' + out + '</td>';
					});
				}
				rows.push('<tr>' + row + '</tr>');
				return rows;
			}, []);
			this.$('.to-data tbody').html(rows.join(''));
		}
		
	});


	return DataImportView;
});
