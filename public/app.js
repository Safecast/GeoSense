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

		this.commentCollection = new CommentCollection();
    },

    map:function () {
		var self = this;
		
	    if (!this.mapView)
		{
            this.mapView = new MapView({
				collection: this.commentCollection,
				vent: self.vent
			});
			$('body').append(this.mapView.render().el);
			this.mapView.start();
			//this.readingsCollection.fetch();
        }
		this.commentCollection.fetch();
		this.sideBarView = new SideBarView({collection: this.commentCollection, vent: this.vent, page: 'map'});
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

	addData:function (options)
	{
		var self = this;
		
		console.log(options.title);
		
		//Request JSON
		var jqxhr = $.getJSON(options.url, function(data) {})
		.success(function(data) { 
			
			console.log("hey " + dataCollection[num_data_sources]);
			
			//First increment total number of data sources
			num_data_sources +=1;

			//Create collection
			dataCollection[num_data_sources] = new DataCollection();
			
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
						dataCollection[num_data_sources].create({name:'point',location:val, datasetid:num_data_sources});
					}
				});
				
				table += "</tr>";				
			}
			
			$('.add-data-view .modal-body .data-table .table').append(table);
			
			//Activate data toggles in adddata view
			self.vent.trigger("toggleAddDataToolTips",dataCollection[num_data_sources]);
			
			//Add SideBar
			dataCollection[num_data_sources].fetch();
			console.log('options.title: ' +options.title);
			this.sideBarDataView = new SideBarDataView({collection:dataCollection[num_data_sources], vent: self.vent, _id:num_data_sources, url: options.url, number: num_data_sources, title:options.title});
			$('#accordion').append(this.sideBarDataView.render().el);
			
		})
		.error(function() { alert("Error loading your file"); })
		.complete(function() {});
		
		//Trigger Google Map render
		//this.vent.trigger("addExternalData", {url:options.url});
		//this.vent.trigger("renderDataToggles", {collection:this.dataCollection, url: options.url}); 
	},

});

tpl.loadTemplates(['map', 'map-gl', 'header','sidebar','sidebar-data', 'modal','add-data'],
    function () {
        app = new AppRouter();
        Backbone.history.start({ pushState: true });
});