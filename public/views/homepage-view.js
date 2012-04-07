window.HomepageView = Backbone.View.extend({

    tagName: 'div',
	className: 'homepage-view',
	
    events: {
		'click #createMap': 'createMapButtonClicked',
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('homepage'));
		this.fetchRecentMaps();
	},

    render: function() {
		$(this.el).html(this.template());
        return this;
    },

	generateUniqueUrl: function(length) {
		var chars, x;
		if (length == null) {
			length = 10;
		}
		chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		var name = [];
		for (x = 0; x < length; x++) {
			name.push(chars[Math.floor(Math.random() * chars.length)]);
		}
		return name.join('');
	},
	
	fetchRecentMaps: function() {
		var self = this;
		$.ajax({
			type: 'GET',
			url: '/api/uniquemaps/',
			success: function(data) {
				
				for(i=0;i<data.length;i++)
				{
					self.$('#mapTable').append('<tr><td>'+data[i].name+'</td><td><a target="_self" href="/'+data[i].mapid+'">geo.media.mit.edu/'+ data[i].mapid +'</a></td><tr>');
				}
			},
			error: function() {
				console.error('failed to fetch unique map');
			}
		});	
	},

	createMapButtonClicked: function() {
		
		var self = this;
		
		this.mapid = this.generateUniqueUrl();
		this.name = this.$('#appendedPrependedInput').val();
		
		if(this.name == '')
			this.name = 'A Map With No Name';
		
		$.ajax({
			type: 'POST',
			url: '/api/map/' + self.mapid + '/' + self.name,
			success: function(data) {
				window.location.href= self.mapid + '/setup';
			},
			error: function() {
				console.error('failed to create a new map');
			}
		});
	}
  
});