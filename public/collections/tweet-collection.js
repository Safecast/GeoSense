TweetCollection = Backbone.Collection.extend({

	model: Tweet,
	
	initialize: function(options) {
		this.url = '/tweets';
		
		$.ajax({
			type: 'GET',
			url: '/tweets/',
			success: function(data) {
				console.log('Streaming tweets');
			},
			error: function() {
				console.error('Could not stream tweets');
			}
		});	
	},
	
	destroy: function(options) {
		
		var self = this;
	    $.ajax({
			type: 'DELETE',
			url: this.url,
			success: function() {
			},
			error: function() {
				console.error('failed to delete tweets');
			}
		});
	},
});