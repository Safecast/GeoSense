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
			'click #dataButton': 'dataButtonClicked',
			'click #dataConfirmButton' : 'dataConfirmButtonClicked',
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
			
			this.$('.drag.label').draggable({
				revert: true,
				stack: '.drag.label'
			});
					
			this.$('#map_canvas').droppable( {
		      accept: '#dragLabel',
		      hoverClass: '',
		      drop: self.handleCardDrop
		    } );
				
	        return this;
	    },

		handleCardDrop:function ( event, ui ) {
		  var draggable = ui.draggable;
		  alert( 'The square with ID "' + draggable.attr('id') + '" was dropped onto me!' );
		},
		
		dataButtonClicked: function() {
			//Todo: Verify string URL
			var self = this;
			this.dataTitle = this.$('#titleInput').val();
			this.dataDescription = this.$('#descriptionInput').val();
			
			// TODO: Add better validation 
			if (true /* this.dataTitle != '' && this.$('#fileInput').val() != ''*/)
			{
				this.requestData();
				this.$('.modal-body .alert').hide();
			}
			else
			{
				this.$('.modal-body .alert').show();
			}
		},
		
		dataConfirmButtonClicked: function()
		{
			//Todo: Validate fields
			//app.addData({data:this.responseData, title:this.dataTitle, description:this.dataDescription});
		},
		
		requestData:function(options)
		{
			var self = this;
			dataType = 'csv';
			/*if(dataType == 'json')
			{
				var self = this;		
				var jqxhr = $.getJSON(options.url, function(data) {})
				.success(function(data) { 	
					self.responseData = data;
					self.showDataReview(data);
				})
				.error(function(err) { alert(err); })
				.complete(function() {});
			}
			else*/ if (dataType == 'csv') {
				$.ajax({
					type: 'POST',
					url: '/api/import/',
					data: {
						file: this.$('#fileInput').val(),
						title: this.$('#titleInput').val(),
						description: this.$('#descriptionInput').val(),
						converter: this.$('#converter').val()
					},
					success: function(responseData) {
						if (responseData.pointCollectionId) {
							app.bindCollectionToMap(responseData.pointCollectionId);
							$('#addDataModal').modal('hide');
						} else {
							// TODO: error
						}
					},
					error: function() {
						console.error('failed to fetch unique map');
					}
				});
			}
		},
		
		showDataReview: function(data)
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
		},

	});

	return AddDataView;
});
