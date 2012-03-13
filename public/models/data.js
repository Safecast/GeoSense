Data = Backbone.Model.extend({
	
	idAttribute: "_id",
	
	defaults: function() {
	      return {
			datasetid: null,
	        name:  'data point',
	        location: '0,0',
			lat: 0,
			lon: 0,
			val: 0,
	      };
	    },
});