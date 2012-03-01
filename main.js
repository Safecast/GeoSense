var AppRouter = Backbone.Router.extend({

    routes:{
        "":"map",
		"gl":"mapGL",
    },

    initialize:function () {
	
		this.vent = _.extend({}, Backbone.Events);
	
        this.headerView = new HeaderView({vent: this.vent});
        $('body').append(this.headerView.render().el);

		this.sideBarView = new SideBarView({vent: this.vent});
        $('body').append(this.sideBarView.render().el);

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
    },

});

tpl.loadTemplates(['map', 'mapgl', 'header','sidebar', 'modal'],
    function () {
        app = new AppRouter();
        Backbone.history.start();
});