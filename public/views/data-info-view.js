window.DataInfoView = Backbone.View.extend({

    tagName: 'div',
	className: 'data-info',
	
    events: {
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('data-info'));	
		this.vent = options.vent;
		this.responseData = null;
		this.dataTitle = '';
		this.dataColor = '#ffffff';
    },

    render: function() {
		$(this.el).html(this.template());
		var self = this;
		
        return this;
    },
});