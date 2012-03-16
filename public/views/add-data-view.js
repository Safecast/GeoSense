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
		
		this.$(".color-picker").miniColors();
		console.log(this.$(".color-picker"));
				
        return this;
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