window.EditDataView = Backbone.View.extend({

    tagName: 'div',
	className: 'edit-data-view',
	
    events: {
		'click #dataButton': 'dataButtonClicked',
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('edit-data'));
		this.vent = options.vent;
    },

    render: function() {
		$(this.el).html(this.template());	
				
		//Build a review table
		var table;
		$('.edit-data-view .modal-body .data-table').append('<table class="table table-striped table-bordered table-condensed"></table>');
		
		for(var i = 0; i < this.collection.length; ++i)
		{
			
			table += "<tr>";
			$.each(this.collection, function(key, val) { 
				table += '<td rel="tooltip" title="'+key+'" class="tooltip-test">' + val + '</td>';
			});
			
			table += "</tr>";	
		}		
		
		$('.edit-data-view .modal-body .data-table .table').append(table);
		
        return this;
    },
	
	dataButtonClicked: function() {
		//Todo: Verify string URL
		var dataTitle = this.$('#titleInput').val();
		var urlPath = this.$('#dataInput').val();
		
		if(dataTitle != '' && urlPath != '')
		{
			app.addData({url:urlPath, title:dataTitle});
		}
		else
		{
			this.$('.modal-body .alert').show();
		}
	},

});