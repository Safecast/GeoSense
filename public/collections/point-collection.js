PointCollection = Backbone.Collection.extend({

	model: Point,
	
	initialize: function(options) {
		this.collectionId = options.collectionId;
		this.url = '/api/collection/' + options.collectionId;
		//this.createAssociativeIndex();
	},
	
	createAssociativeIndex: function()
	{
		$.ajax({
			type: 'POST',
			url: '/api/datacollection/' + this.collectionId,
			success: function(data) {
				console.log('created associated collection: ' + data);
			},
			error: function() {
				console.error('failed to create an associated collection');
			}
		})
	},
	
	destroy: function(options) {
		console.log('his.url' + this.url);
		var self = this;
	    $.ajax({
			type: 'DELETE',
			url: this.url,
			success: function() {
				console.log('deleted collection: ' + self.collectionId);
			},
			error: function() {
				console.error('failed to delete collection: ' + this.collectionId);
			}
		})
	}

});