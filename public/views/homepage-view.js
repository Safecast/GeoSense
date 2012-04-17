window.HomepageView = Backbone.View.extend({

    tagName: 'div',
	className: 'homepage-view',
	
    events: {
		'click #createMap': 'createMapButtonClicked',
		'click #nextMapSet' : 'nextMapSetClicked',
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('homepage'));
		this.fetchRecentMaps();
		this.recentMaps = [];
		this.recentMapSet = 0;
		this.numberOfMapsDisplay = 5;
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
					currMap = '<tr><td>'+data[i].name+'</td><td><a target="_self" href="/'+data[i].mapid+'">geo.media.mit.edu/'+ data[i].mapid +'</a></td><tr>';
					self.recentMaps.push(currMap);
					//self.$('#mapTable').append('<tr><td>'+data[i].name+'</td><td><a target="_self" href="/'+data[i].mapid+'">geo.media.mit.edu/'+ data[i].mapid +'</a></td><tr>');
				}
				self.showRecentMaps();
			},
			error: function() {
				console.error('failed to fetch unique map');
			}
		});	
	},
	
	showRecentMaps: function()
	{
		if((this.recentMapSet + this.numberOfMapsDisplay) >= this.recentMaps.length)
		{
			this.$('#nextMapSet').fadeOut('fast');
		}
		
		var self = this;
		self.$('#mapTable').fadeOut('fast',function(){
			self.$('#mapTable').empty();
			for(i=self.recentMapSet;i<(self.numberOfMapsDisplay + self.recentMapSet);i++)
			{
				self.$('#mapTable').append(self.recentMaps[i]);
			}
			self.$('#mapTable').fadeIn('fast');
		});	
	},
	
	nextMapSetClicked: function()
	{
		this.recentMapSet+=this.numberOfMapsDisplay;
		this.showRecentMaps();
	},

	createMapButtonClicked: function() {
		
		var self = this;
		
		this.mapid = this.generateUniqueUrl();
		this.mapadminid = this.generateUniqueUrl(15);
		
		this.name = this.$('#appendedPrependedInput').val();
		
		if(this.name == '' || this.name == undefined)
		{	
			this.$('#errorMessage').show();
		} else
		{
			$.ajax({
				type: 'POST',
				url: '/api/map/' + self.mapid + '/' + self.mapadminid + '/' + self.name,
				success: function(data) {
					window.location.href= self.mapadminid + '/setup';
				},
				error: function() {
					console.error('failed to create a new map');
				}
			});
		}
	}
  
});