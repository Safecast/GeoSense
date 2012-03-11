var AppRouter = Backbone.Router.extend({

    routes:{
        "":"map",
		"globe":"mapGL",
    },

    initialize:function () {
		var self = this;
		this.vent = _.extend({}, Backbone.Events);
	
        this.headerView = new HeaderView({vent: this.vent});
        $('body').append(this.headerView.render().el);

		this.readingsCollection = new ReadingCollection();
    },

    map:function () {
		var self = this;
		
	    if (!this.mapView)
		{
            this.mapView = new MapView({
				collection: this.readingsCollection,
				vent: self.vent
			});
			$('body').append(this.mapView.render().el);
			this.mapView.start();
			this.readingsCollection.fetch();
        }

		this.sideBarView = new SideBarView({vent: this.vent, page: 'map'});
        $('body').append(this.sideBarView.render().el);
    },

	mapGL:function () {
		var self = this;
		
	    if (!this.mapView)
		{
            this.mapView = new MapGLView({
				collection: this.readingsCollection,
				vent: self.vent
			});
			$('body').append(this.mapView.render().el);
			this.mapView.start();
			this.readingsCollection.fetch();
        }

		this.sideBarView = new SideBarView({vent: this.vent, page: 'map-gl'});
        $('body').append(this.sideBarView.render().el);
    },

	addData:function (url)
	{
	 	num_data_sources +=1;
		this.vent.trigger("renderDataToggles", {url: url}); 
	},

});

tpl.loadTemplates(['map', 'map-gl', 'header','sidebar','sidebar-data', 'modal','add-data'],
    function () {
        app = new AppRouter();
        Backbone.history.start({ pushState: true });
});