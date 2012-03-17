window.AddDataView = Backbone.View.extend({

    tagName: 'div',
	className: 'add-data-view',
	
    events: {
		'click #dataButton': 'dataButtonClicked',
		'click #dataConfirmButton' : 'dataConfirmButtonClicked',
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('add-data'));	
		this.vent = options.vent;
		this.responseData = null;
		this.dataTitle = '';
		this.dataColor = '';
    },

    render: function() {
		$(this.el).html(this.template());
		var self = this;
		
		this.$('#dragLabel').draggable({
			revert: true,
			stack: '#dragLabel'
		});
				
		this.$('#dataTable').droppable( {
	      accept: '#dragLabel',
	      hoverClass: '',
	      drop: self.handleCardDrop
	    } );
		
		this.$(".color-picker").miniColors();
				
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
		var urlPath = this.$('#dataInput').val();
		
		if(this.dataTitle != '' && urlPath != '')
		{
			this.requestData({url:urlPath});
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
		$('#addDataModal').modal('hide');
		app.addData({data:this.responseData, title:this.dataTitle});
	},
	
	requestData:function (options)
	{
		var self = this;		
		var jqxhr = $.getJSON(options.url, function(data) {})
		.success(function(data) { 	
			self.responseData = data;
			self.showDataReview(data);
		})
		.error(function() { alert("Error loading your file"); })
		.complete(function() {});
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
				for(var i = 0; i < data.length; ++i)
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