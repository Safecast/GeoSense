window.SideBarDataView = Backbone.View.extend({

    tagName: 'div',
	className: 'sidebar-data',
	
    events: {
		'click #removeData:' : 'removeDataClicked',
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('sidebar-data'));
		this.vent = options.vent;
		this.number = options.number;
		this.title = options.title;
		this.url = options.url	
		this._id = options._id
		
		this.collection.bind('add',   this.addOne, this);
		this.collection.bind('reset', this.addAll, this);

		console.log("dataset id: " + this._id + " length: " + this.collection.length);
    },

    render: function() {
		$(this.el).html(this.template());
				
		if(this.title != '')
		{
			dataTitle = this.title;
		}
		else
		{
			dataTitle = "Untitled Data";
		}
		
		dataTitle += " ("+ this.collection.length + ")";
		
		this.$("a").html('<i class="icon-map-marker icon-white"></i> ' + dataTitle);
		this.$("a").attr("href", "#collapse" + this.number);
		this.$("#collapse").attr("id", "collapse" + this.number);
		
        return this;
    },

	addOne: function(data) {
		var self = this;
    },

    addAll: function() {
      var self = this;
		this.collection.each(function(data){ 
		self.addOne(data);
	 	});
    },

	removeDataClicked: function()
	{
		var self = this;
		$(this.el).fadeOut('fast',function()
		{
			self.collection.destroy();
		});
   	},
});