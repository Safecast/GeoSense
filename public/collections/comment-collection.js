CommentCollection = Backbone.Collection.extend({

	model: Comment,
	
	initialize: function(options) {
		this.url = '/api/comments/map/' + app.mapInfo._id;
	},
	
});