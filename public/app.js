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
		
		//Gather distinct collections
		//This returns an array containing collectionid for lookup
		$.ajax({
			type: 'GET',
			url: '/api/collection/distinct',
			success: function(data) {
				
				num_data_sources = data.length;
				for(i=0;i<num_data_sources;i++)
				{
					// For each distinct data source, add an existing data source to the app.
					// This binds a data model and sidebar data view
					self.addExistingDataSources(i+1);
				}
			},
			error: function() {
				console.error('failed to fetch distinct collections');
			}
		})
    },

    map:function () {
		var self = this;
		
	    if (!this.mapView)
		{
            this.mapView = new MapView({
				vent: self.vent
			});
			$('body').append(this.mapView.render().el);
			this.mapView.start();
			//this.readingsCollection.fetch();
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
        }

		this.sideBarView = new SideBarView({vent: this.vent, page: 'map-gl'});
        $('body').append(this.sideBarView.render().el);
    },

	addData:function (options)
	{
		var self = this;
				
		//Request JSON
		var jqxhr = $.getJSON(options.url, function(data) {})
		.success(function(data) { 
						
			//First increment total number of data sources
			num_data_sources +=1;

			//Create collection
			pointCollection[num_data_sources] = new PointCollection({
				collectionId:num_data_sources,
				title:options.title,
				newData:true,
			});
			
			//We build a review table in the response, should be moved to edit view
			$('.add-data-view .modal-body .data-table').append('<table class="table table-striped table-bordered table-condensed"></table>');
			
			var table;
			for(var i = 0; i < data.length; ++i)
			{
				table += "<tr>";
				
				$.each(data[i], function(key, val) { 
					table += '<td rel="tooltip" title="'+key+'" class="tooltip-test">' + val + '</td>';
					if(key == 'Location')
					{
						self.vent.trigger("drawExternalData",val);	
						pointCollection[num_data_sources].create({name:'point',location:val});
					}
				});
				
				table += "</tr>";				
			}
			
			$('.add-data-view .modal-body .data-table .table').append(table);
			
			//Activate data toggles in adddata view
			self.vent.trigger("toggleAddDataToolTips",pointCollection[num_data_sources]);
			
			//Append a new side bar view
			self.addSideBarDataView({collectionId:num_data_sources,title:options.title});
			
		})
		.error(function() { alert("Error loading your file"); })
		.complete(function() {});
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
						});
						pointCollection[this.index].fetch({success: function() {
							//Add a new sidebar data view once data is fetched
							self.addSideBarDataView({collectionId:scope.index,dataLength:data.length,title:name});
							if(this.mapView)
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

tpl.loadTemplates(['map', 'map-gl', 'header','sidebar','sidebar-data', 'modal','add-data'],
    function () {
        app = new AppRouter();
        Backbone.history.start({ pushState: true });
});