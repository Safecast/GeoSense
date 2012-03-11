window.SideBarDataView = Backbone.View.extend({

    tagName: 'div',
	className: 'sidebar-data-view',
	
    events: {
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('sidebar-data'));
		this.vent = options.vent;
		
		data[num_data_sources] = new DataCollection();
		
		//Trigger Google Map render
		this.vent.trigger("addExternalData", options.url);	
    },

    render: function(options) {
		$(this.el).html(this.template());
		
		//Add specific identity for accordian open-close logic		
		this.$("a").attr("href", "#collapse" + options.number);
		this.$("#collapse").attr("id", "collapse" + options.number);
		
        return this;
    },

});