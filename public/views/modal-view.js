window.ModalView = Backbone.View.extend({

    tagName: 'div',
	className: 'modal fade',
	templateName: 'modal',
	
    events: {
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get(this.templateName));
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
  
  	show: function() 
  	{
  		var self = this;
        $('body').append(this.el);
		$(this.el).modal('show');
		$(this.el).on('hidden', function() {
			$(self.el).detach();
		});
  	},

    close: function()
    {
		$(this.el).modal('hide');
    },

});