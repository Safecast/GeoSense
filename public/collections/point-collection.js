PointCollection = Backbone.Collection.extend({

	model: Point,
	
	initialize: function(options) {
		this.collectionId = options.collectionId;
		this.url = '/api/collection/' + options.collectionId;
		this.title = options.title;
				
		if(options.newData == true)		
			this.createAssociativeIndex();
	},
	
	createAssociativeIndex: function()
	{	
		var self = this;
		$.ajax({
			type: 'POST',
			url: '/api/pointcollection/' + this.collectionId + '/' + this.title,
			success: function(data) {
				console.log('created associated collection: ' + self.collectionId);
			},
			error: function() {
				console.error('failed to create an associated collection');
			}
		})
	},
	
	destroy: function(options) {
		
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
		});
		
		this.destroyAssociativeIndex(options);
		//this.reset();
	},
	
	destroyAssociativeIndex: function() {
		
		var self = this;
		$.ajax({
			type: 'DELETE',
			url: '/api/pointcollection/' + this.collectionId,
			success: function(data) {
				console.log('Destroyed associated collection: ' + self.collectionId);
			},
			error: function() {
				console.error('Failed to destroy associated collection: ' + self.collectionId);
			}
		})
	},

});