PointCollection = Backbone.Collection.extend({

	model: Point,
	
	comparator: function(point) {
		return point.get('datetime');
	},
	
	initialize: function(options) {
						
		this.pointCollectionId = options.pointCollectionId;
		this.baseUrl = '/api/mappoints/' + this.pointCollectionId;
		this.mapLayer = options.mapLayer;

		//TODO: deprecated
		this.collectionId = this.pointCollectionId;

		/*
		// TODO: Use mapLayer.pointCollection instead
		this.title = options.title;
		this.maxVal = options.maxVal;
		this.minVal = options.minVal;
		this.created = options.created;
		this.modified = options.modified;
		this.createdBy = options.created_by;
		this.modifiedBy = options.modifiedBy;
		this.timeBased = options.timeBased;
		this.defaults = options.defaults;
		*/

		this.urlParams = options.urlParams ? $.extend({}, options.urlParams) : {};
								
		if (options.newData == true)	{
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
		console.log('PointCollection.fetch '+this.pointCollectionId);	
		return PointCollection.__super__.fetch.call(this, options);
	},

    parse: function(resp, xhr) {
    	if (resp['items']) {
    		this.fullCount = resp.fullCount;
    		this.maxCount = resp.maxCount;
    		this.originalCount = resp.originalCount;
    		resp = resp['items'];
    	}
		return PointCollection.__super__.parse.call(this, resp, xhr);
    },

	addData: function(data, callback) {
		
		var self = this;
				
		$.ajax({
			type: 'POST',
			dataType: 'json',
			data: data,
			url: '/api/addpoints/' + this.pointCollectionId,
			success: function() {
				console.log('Adding points for: ' + self.pointCollectionId);
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
			url: '/api/pointcollection/' + this.pointCollectionId + '/' + this.title + '/' + _mapId + '/' + this.maxVal+ '/' + this.minVal,
			success: function(data) {
				console.log('created associated collection: ' + self.pointCollectionId);
			},
			error: function() {
				console.error('failed to create an associated collection');
			}
		})
	},
	
	unbindCollection: function() {
		console.log('unbinding '+this.pointCollectionId);
		
		var self = this;		
	    $.ajax({
			type: 'POST',
			url: '/api/unbindmapcollection/'+_mapId+'/' + self.pointCollectionId,
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
				console.log('Removed collection: ' + self.pointCollectionId);
			},
			error: function() {
				console.error('failed to remove collection: ' + self.pointCollectionId);
			}
		});
		
		this.destroyAssociativeIndex(options);
	},
	
	destroyAssociativeIndex: function() {
		
		var self = this;
		$.ajax({
			type: 'DELETE',
			url: '/api/pointcollection/' + this.pointCollectionId,
			success: function(data) {
				console.log('Destroyed associated collection: ' + self.pointCollectionId);
			},
			error: function() {
				console.error('Failed to destroy associated collection: ' + self.pointCollectionId);
			}
		})
	},
});