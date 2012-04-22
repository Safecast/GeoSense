PointCollection = Backbone.Collection.extend({

	model: Point,
	
	comparator: function(point) {
		return point.get('date');
	},
	
	initialize: function(options) {
						
		this.url = '/api/collection/' + options.collectionId;
		
		this.collectionId = options.collectionId;
		this.title = options.title;
		this.maxVal = options.maxVal;
		this.minVal = options.minVal;
		this.created = options.created;
		this.modified = options.modified;
		this.createdBy = options.created_by;
		this.modifiedBy = options.modifiedBy;
		this.timeBased = options.timebased;
		this.defaults = options.defaults;
								
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
			dataType: 'json',
			data: { jsonpost: this.defaults },
			url: '/api/pointcollection/' + this.collectionId + '/' + this.title + '/' + _mapId + '/' + this.maxVal+ '/' + this.minVal,
			success: function(data) {
				console.log('created associated collection: ' + self.collectionId);
			},
			error: function() {
				console.error('failed to create an associated collection');
			}
		})
	},
	
	unbindCollection: function() {
		console.log('unbinding...');
		
		var self = this;		
	    $.ajax({
			type: 'POST',
			url: '/api/unbindmapcollection/'+_mapId+'/' + self.collectionId,
			success: function(data) {
			},
			error: function() {
				console.error('failed to unbind collection');
			}
		});
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