window.AddData = Backbone.View.extend({

    tagName: 'div',
	className: 'add-data-view',
	
    events: {
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('add-data'));
    },

    render: function() {
		$(this.el).html(this.template());		
        return this;
    },
});