window.ModalView = Backbone.View.extend({

    tagName: 'div',
	className: 'modal-view',
	
    events: {
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('modal'));
    },

    render: function() {
		$(this.el).html(this.template());		
        return this;
    },

	setTitle: function(string)
	{
		this.$('.modal-header .title').html(string);
	},
	
	setBody: function(string)
	{
		this.$('.modal-body .body').html(string);
	},
  
});