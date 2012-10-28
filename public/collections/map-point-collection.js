MapPointCollection = Backbone.Collection.extend({

	model: Point,
	
	comparator: function(point) {
		return point.get('datetime');
	},
	
	initialize: function(options) {
						
		this.pointCollectionId = options.pointCollectionId;
		this.baseUrl = '/api/mappoints/' + this.pointCollectionId;
		this.mapLayer = options.mapLayer;
		this.urlParams = options.urlParams ? $.extend({}, options.urlParams) : {};
		this.visibleMapAreaFetched = false;
	},

	url: function() {
		return this.baseUrl + '?' + genQueryString(this.urlParams);
	},

	setVisibleMapArea: function(visibleMapArea) {
		console.log('MapPointCollection.setVisibleMapArea '+this.pointCollectionId);	
		this.urlParams.b = [visibleMapArea.bounds[0][0], visibleMapArea.bounds[0][1], visibleMapArea.bounds[1][0], visibleMapArea.bounds[1][1]];
		this.urlParams.z = visibleMapArea.zoom;
		this.visibleMapAreaFetched = false;
	},

	fetch: function(options) {
		console.log('MapPointCollection.fetch '+this.pointCollectionId);	
		return MapPointCollection.__super__.fetch.call(this, options);
	},

    parse: function(resp, xhr) {
    	if (resp['items']) {
    		this.fullCount = resp.fullCount;
    		this.maxReducedCount = resp.maxReducedCount;
    		this.resultCount = resp.resultCount;
    		this.originalCount = resp.originalCount;
    		this.gridSize = resp.gridSize;
    		resp = resp['items'];
    	}
		this.visibleMapAreaFetched = true;
		return MapPointCollection.__super__.parse.call(this, resp, xhr);
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
	
	unbindCollection: function() {
		console.log('unbinding '+this.pointCollectionId);
		
		var self = this;		
	    $.ajax({
			type: 'POST',
			url: '/api/unbindmapcollection/' + app.mapInfo._id + '/' + self.pointCollectionId,
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