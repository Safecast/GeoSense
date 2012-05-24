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

		_.bindAll(this, "updateDataInfo");
	 	options.vent.bind("updateDataInfo", this.updateDataInfo);
    },

    updateDataInfo: function()
	{		
		console.log('updating data info!');
	},

    render: function() {
		$(this.el).html(this.template());
		var self = this;
		
        return this;
    },
});