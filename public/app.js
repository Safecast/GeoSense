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

		this.sideBarView = new SideBarView({vent: this.vent, page: 'map'});
        $('body').append(this.sideBarView.render().el);
		
		//Gather distinct collections
		//This returns an array containing collectionid for lookup
		$.ajax({
			type: 'GET',
			url: '/api/collection/distinct',
			success: function(data) {
		
				//Save the distinct collection Id(s) to app scope
				num_data_sources = data.length;
				
				for(i=0;i<num_data_sources;i++)
				{
					// For each distinct data source, add an existing data source to the app.
					// This binds a data model and sidebar data view
					self.addExistingDataSources(data[i]);
				}
			},
			error: function() {
				console.error('failed to fetch distinct collections');
			}
		})
    },

	maxValue: function( array ){
	    return Math.max.apply( Math, array );
	},
	
	uniqid: function ()
	{
	    var newDate = new Date;
	    return newDate.getTime();
	},

    map:function () {
		var self = this;
		
		if(this.mapView)
		{
			this.mapView.remove();
			this.mapView = null;
		}
		
	    if (!this.mapView)
		{
            this.mapView = new MapView({
				vent: self.vent
			});
			$('body').append(this.mapView.render().el);
			this.mapView.start();
			//this.readingsCollection.fetch();
        }
    },

	mapGL:function () {
		var self = this;
		
		if(this.mapView)
		{
			this.mapView.remove();
			this.mapView = null;
		}
				
	    if (!this.mapView)
		{			
            this.mapView = new MapGLView({
				collection: this.readingsCollection,
				vent: self.vent
			});
			$('body').append(this.mapView.render().el);
			this.mapView.start();
        }

    },

	addData:function (options)
	{
		var self = this;
		var uniqid = this.uniqid();
		var title = options.title
		var data = options.data;
		
		//First increment total number of data sources
		num_data_sources +=1;
		
		//Create collection
		pointCollection[num_data_sources] = new PointCollection({
			collectionId:uniqid,
			title:title,
			newData:true,
		});
		
		for(var i = 0; i < data.length; ++i)
		{
			$.each(data[i], function(key, val) { 
				
				if(key == 'Location')
				{
					pointCollection[num_data_sources].create({name:'point',location:val});
				}
			});	
		}
		
		//Activate data toggles in adddata view
		self.vent.trigger("toggleAddDataToolTips",pointCollection[num_data_sources]);
		
		//Append a new side bar view
		self.addSideBarDataView({collectionId:num_data_sources,title:title});
		
		//If MapView, add new markers
		self.addMapCollection(uniqid, pointCollection[num_data_sources]);		
			
	},
	
	addExistingDataSources: function(index)
	{
		var self = this;
		
		//First we look up the pointcollection for name & collectionid
		$.ajax({
			type: 'GET',
			url: '/api/pointcollection/' + index,
			success: function(data) {
				var name = data[0].name;
				//Now look up all points related to this collectionid
				$.ajax({
					type: 'GET',
					url: '/api/collection/' + index,
					success: function(data) {
						var scope = this;
						scope.index = index;
						
						pointCollection[this.index] = new PointCollection({
							collectionId:index,
							title:'title',
							newData:false,
						});
						pointCollection[this.index].fetch({success: function() {
							//Add a new sidebar data view once data is fetched
							self.addSideBarDataView({collectionId:scope.index,dataLength:data.length,title:name});
							if(self.mapView)
								self.addMapCollection(scope.index, pointCollection[scope.index]);	
						}});
						
					},
					error: function() {
						console.error('failed to fetch existing data source');
					}
				});
			},
			error: function() {
				console.error('failed to fetch existing data source');
			}
		})	
	},
	
	addSideBarDataView:function (options) {
		//Add SideBar
		this.sideBarDataView = new SideBarDataView({collection:pointCollection[options.collectionId], collectionId: options.collectionId, title:options.title});
		$('#accordion').append(this.sideBarDataView.render().el);
	},
	
	addMapCollection: function(id, collection)
	{
		this.mapView.addCollection(id, collection);
	},

});

tpl.loadTemplates(['map', 'map-gl', 'header','sidebar','sidebar-data', 'modal','add-data','edit-data'],
    function () {
        app = new AppRouter();
        Backbone.history.start({ pushState: true });
});