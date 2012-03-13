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
        return this;
    },
	
	dataButtonClicked: function() {
		//Todo: Verify string URL
		var urlPath = this.$('#dataInput').val();
		app.addData({url:urlPath});
	},

});