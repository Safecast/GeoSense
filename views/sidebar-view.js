window.SideBarView = Backbone.View.extend({

    tagName: 'div',
	className: 'sidebar-view',
	
    events: {
		'click #light_theme': 'lightFilterClicked',
		'click #dark_theme': 'darkFilterClicked',
		'click #standard_theme': 'standardFilterClicked',
		'click #display2D': 'display2DClicked',
		'click #display3D': 'display3DClicked',
		'click #addData': 'addDataClicked',
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('sidebar'));
		this.vent = options.vent;
		this.page = options.page;
		
		_.bindAll(this, "renderDataToggles");
	 	options.vent.bind("renderDataToggles", this.renderDataToggles);
		
    },

    render: function() {
		$(this.el).html(this.template());	
				
		if(this.page == 'map')
		{
			this.$('#display2D').addClass('active');
			
		}
		else if (this.page =='map-gl')
		{
			this.$('#themeToggleGroup').hide();
			this.$('#display3D').addClass('active');
		}
					
        return this;
    },

	renderDataToggles: function(){
		
		for (i=1; i<= num_data_sources; i++)
		{
			this.addDataToggle({number:i});
		}
	},

	addDataToggle: function(options) {
		console.log('adding data: ' + options.number);
		this.$('#accordion').append('<div class="accordion-group"><div class="accordion-heading"><a class="accordion-toggle btn btn-inverse" data-toggle="collapse" data-parent="#accordion" href="#collapse'+ options.number +'><i class="icon-map-marker icon-white"></i> Data Title</a></div><div id="collapse'+options.number+'" class="accordion-body collapse"><div class="accordion-inner"><div class="data-toggle"><p>Data</p><div class="btn-group" data-toggle="buttons-radio"><button class="btn active">Visible</button><button class="btn">Hidden</button></div></div></div></div></div>');
		
	},
	
	removeDataToggle: function() {
		
	},

	lightFilterClicked: function() {
		this.vent.trigger("updateMapStyle", 'light');
	},

	darkFilterClicked: function() {
		this.vent.trigger("updateMapStyle", 'dark');
	},
	
	standardFilterClicked: function() {
		this.vent.trigger("updateMapStyle", 'standard'); 
	},
	
	display2DClicked: function() {
		//Todo: Replace with proper routing
		app.navigate("", {trigger: false});
		window.location.href = '';
	},

	display3DClicked: function() {
		//Todo: Replace with proper routing
		app.navigate("globe", {trigger: false});
		window.location.href = '/#globe';
	},
	
	addDataClicked: function() {
		this.addDataView = new AddDataView({vent: this.vent});
        $('body').append(this.addDataView.render().el);
		$('#addDataModal').modal('toggle');
	},

});