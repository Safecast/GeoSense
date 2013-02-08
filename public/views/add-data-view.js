define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/add-data.html',
], function($, _, Backbone, config, utils, templateHtml) {
	var AddDataView = Backbone.View.extend({

	    tagName: 'div',
		className: 'add-data-view',
		
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
			$(this.el).html(this.template());
			var self = this;
			this.$('.modal').addClass('large');

			this.fromFieldTemplate = this.$('.from-data thead .element-template');
			this.toFieldTemplate = this.$('.to-data thead .element-template');
			this.$('.element-template').remove();
			
			this.fromFieldColors = ['#c43c35', '#f89406', '#46a546', '#62cffc'];
			this.fromFields = {
				'location': 'location',
				'Facility': 'Facility',
				'val': 'val',
				'year': 'year'
			};

			this.toFields = {
				'loc': 'Point X,Y',
				'val': 'Point Value',
				'datetime':'Date',
				'label': 'Point Label'
			};

			var i = 0;
			for (var k in this.fromFields) {
				var f = this.fromFieldTemplate.clone();
				f.removeClass('element-template');
				$('.name', f).text(this.fromFields[k]);
				$('.label', f).css('background-color', this.fromFieldColors[i % this.fromFieldColors.length]);
				$('.from-field', f).attr('data-from', k);
				this.$('.from-data thead').append(f).show();
				i++;
			}

			for (var k in this.toFields) {
				var f = this.toFieldTemplate.clone();
				f.removeClass('element-template');
				$('.name', f).text(this.toFields[k]);
				$('.to-field', f).attr('data-to', k);
				this.$('.to-data thead').append(f).show();
			}

			this.$('.to-field').sortable({
				connectWith: '.to-field'
			});

			this.$('.from-field').draggable({
				revert: "invalid",
				helper: "clone",
				connectToSortable: '.to-field',
				stack: '.drag.label'
			});
					
			/*this.$('.drop-field').droppable( {
		      accept: '.drag-field',
		      hoverClass: '',
		      drop: self.handleCardDrop
		    } );*/
				
	        return this;
	    },

	    fromFieldRemoveClicked: function(event) {
			$(event.currentTarget).closest('.from-field').remove();
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
					
					$('.add-data-view .modal-body .review .data-table').append('<table class="table table-striped table-bordered table-condensed"></table>');

					var table;
					for(var i = 0; i < 50; ++i) // 50 or data.length
					{
						table += "<tr>";

						$.each(data[i], function(key, val) { 
							table += '<td rel="tooltip" title="'+key+'" class="tooltip-test">' + val + '</td>';
						});

						table += "</tr>";				
					}

					$('.add-data-view .modal-body .review .data-table .table').append(table);
						
				});	
			});
		},*/

	});

	return AddDataView;
});
