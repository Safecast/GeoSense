CommentCollection = Backbone.Collection.extend({

	model: Comment,
	
	initialize: function(options) {
		this.url = '/api/comments/map/' + _mapId;
		
		$.ajax({
			type: 'GET',
			url: this.url,
			success: function(data) {
				console.log('Retrieved Comments');
			},
			error: function() {
				console.error('Could not retrieve comments');
			}
		});
	},
	
	destroy: function(options) {
		
	},
	
	reset: function()
	{
		console.log('reset');
	},
});