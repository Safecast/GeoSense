window.AddDataView = Backbone.View.extend({

    tagName: 'div',
	className: 'add-data-view',
	
    events: {
		'click #dataButton': 'dataButtonClicked',
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('add-data'));	
		this.vent = options.vent;
    },

    render: function() {
		$(this.el).html(this.template());
		var self = this;
		this.$('#dragLabel').draggable();
		
		this.$('#dragLabel').droppable( {
		    drop: self.handleDropEvent
		} );
		
		this.$(".color-picker").miniColors();
				
        return this;
    },

	handleDropEvent:function ( event, ui ) {
	  var draggable = ui.draggable;
	  alert( 'The square with ID "' + draggable.attr('id') + '" was dropped onto me!' );
	},
	
	dataButtonClicked: function() {
		//Todo: Verify string URL
		var self = this;
		var dataTitle = this.$('#titleInput').val();
		var urlPath = this.$('#dataInput').val();
		
		if(dataTitle != '' && urlPath != '')
		{
			this.$('.modal').addClass('large');
			
			this.$('.modal-body .add').fadeOut(function(){
				self.$('.modal-body .review').fadeIn(function(){
					app.addData({url:urlPath, title:dataTitle});
				});	
			});
		}
		else
		{
			this.$('.modal-body .alert').show();
		}
	},

});