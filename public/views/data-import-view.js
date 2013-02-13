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
				'location': 'location',
				'Facility': 'Facility',
				'val': 'val',
				'year': 'year',
				'bla': 'bla',
				'foooo': 'asdasd',
				'Long fucking field oh yeahhhhhh': 'Long',
				'locasdation': 'location',
				'Facsility': 'Facility',
				'vadl': 'val',
				'yesar': 'year',
				'blsa': 'bla',
				'fodooo': 'asdasd'
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
				$('.show-field-settings', f).click(function() {
					$('.field-settings', f).toggle();
					return false;
				});
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
				connectWith: '.to-field'
			});

			this.$('.from-field').draggable({
				revert: "invalid",
				helper: "clone",
				connectToSortable: '.to-field',
				stack: '.drag.label',
				start: function(event, ui) {
					$(ui.helper).removeClass('half-opacity');
					self.$('.to-field').addClass('highlight');
				},
				stop: function(event, ui) {
					self.$('.to-field').removeClass('highlight');
					$(ui).addClass('mapped');
					self.$('.to-data .from-field').removeClass('half-opacity');
					self.updateHandleStates();
				}
			});
					
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
			return false;
	    },

	    showAlert: function(html) {
	    	if (!html) {
				this.$('.modal-body .alert').hide();
	    	} else {
				this.$('.modal-body .alert').show();
				this.$('.modal-body .alert').html(html);
	    	}
	    },

	    getFieldDefs: function() {
			var defs = {};
			for (var k in this.toFields) {
				console.log(this.$('.to-field[data-to=' + k +'] .from-field'));
				var fromFields = this.$('.to-field[data-to=' + k +'] .from-field');
				defs[k] = {
					fromFields: []
				};
				for (var i = 0; i < fromFields.length; i++) {
					defs[k].fromFields.push($(fromFields[i]).attr('data-from'));
				}
			}
			return defs;
	    },
		
		importButtonClicked: function() {
			this.startImport();
		},
		
		startImport: function()
		{
			var self = this;
			self.$('#importButton').attr('disabled', true);
			$.ajax({
				type: 'POST',
				url: '/api/import/',
				data: {
					url: 'https://dl.dropbox.com/s/03cqpv1camzz4a1/reactors.csv',
					fields: this.getFieldDefs()
				},
				success: function(responseData) {
					app.bindCollectionToMap(responseData.pointCollectionId);
					$('#addDataModal').modal('hide');
					self.close();
				},
				error: function(jqXHR, textStatus, errorThrown) {
					var data = $.parseJSON(jqXHR.responseText);
					console.error('import failed', data.errors);
					var lis = '';
					if (data && data.errors) {
						for (var k in data.errors) {
							lis += '<li>' + data.errors[k].message + '</li>';
						}
						console.error('errors:', data.errors);
						self.showAlert('<ul>' + lis + '</ul>');
					}
					self.$('#importButton').attr('disabled', false);
				}
			});
		},
		
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
