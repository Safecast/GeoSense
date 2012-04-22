PointCollection = Backbone.Collection.extend({

	model: Point,
	
	comparator: function(point) {
		return point.get('datetime');
	},
	
	initialize: function(options) {
						
		this.baseUrl = '/api/mappoints/' + options.collectionId;
		
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
		this.urlParams = options.urlParams || {};
								
		if(options.newData == true)	{
			this.createAssociativeIndex();
		}
	},

	url: function() {
		return this.baseUrl + '?' + genQueryString(this.urlParams);
	},

	setVisibleMapArea: function(visibleMapArea) {
		console.log('PointCollection.setVisibleMapArea');	
		this.urlParams.b = [visibleMapArea.bounds[0][0], visibleMapArea.bounds[0][1], visibleMapArea.bounds[1][0], visibleMapArea.bounds[1][1]];
		this.urlParams.z = visibleMapArea.zoom;
	},

	fetch: function(options) {
		console.log('PointCollection.fetch');	
		return PointCollection.__super__.fetch.call(this, options);
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