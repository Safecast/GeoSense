DataCollection = Backbone.Collection.extend({

	model: Data,
	url: '/api/data',
	
	empty: function(options) {
	    for(i=this.length-1; i>=0; i--) {
	        var model = this.at(i);
			if(model.get('datasetid') == options._id)
	        	model.destroy();
	    };
	}

});