PointCollection = Backbone.Collection.extend({

	model: Point,
	
	comparator: function(point) {
		return point.get('date');
	},
	
	initialize: function(options) {
				
		this.collectionId = options.collectionId;
		this.mapId = options.mapId;
		this.url = '/api/collection/' + options.collectionId;
		this.title = options.title;
		this.maxVal = options.maxVal;
		this.minVal = options.minVal;
						
		if(options.newData == true)		
			this.createAssociativeIndex();
	},
	
	addData: function(data, callback) {
				
		var self = this;
		var jsonData = JSON.stringify(data);
				
		$.ajax({
			type: 'POST',
			dataType: 'json',
			data: { jsonpost: data },
			url: '/api/addpoints/' + this.collectionId,
			success: function() {
				console.log('Adding points for: ' + self.collectionId);
				callback();
			},
			error: function() {
				console.error('failed to add point bundle');
			}
		});		
	},
	
	createAssociativeIndex: function()
	{	
		var self = this;
		$.ajax({
			type: 'POST',
			url: '/api/pointcollection/' + this.collectionId + '/' + this.title + '/' + this.mapId + '/' + this.maxVal+ '/' + this.minVal,
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
				console.log('Removed collection: ' + self.collectionId);
			},
			error: function() {
				console.error('failed to remove collection: ' + self.collectionId);
			}
		});
		
		this.destroyAssociativeIndex(options);
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