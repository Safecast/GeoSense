window.DataLibrary = Backbone.View.extend({

    tagName: 'div',
	className: 'data-library',
	
    events: {
		'click #closeDatalibrary:' : 'closeButtonClicked',
    },

    initialize: function(options) {
	    this.template = _.template(tpl.get('data-library'));
    },

    render: function() {
		var self = this;
		$(this.el).html(this.template());
		
		this.fetchDataCollections();
			
		$(this.el).animate({left: -350}, 1, function()
		{
			$(self.el).css('display','block');	
			$(self.el).animate({
			    left: 0,
			  }, 400, 'easeOutQuad', function() {
			  });
		});	
		
        return this;
    },

	show: function()
	{
		$(this.el).addClass('visible');	
	},

	fetchDataCollections: function() {	
		
		
		var self = this;	
		$.ajax({
			type: 'GET',
			url: '/api/pointcollections',
			success: function(data) {
				
				$.each(data, function(key, val) { 
					//Check to see if the map already has the collection
					valStr = String(val.collectionid);
					var search = jQuery.inArray(valStr,_mapCollections);
					if(search == -1)
						self.drawDataSource(val);
				});
				
				self.$('#dragLabel').draggable({
					revert: true,
					stack: '#dragLabel',
					start: function(event, ui) { 
						var test = 'blah';
						$('#mapOLDataDrop').addClass('visible');
						$(this).css("opacity",".9");
					},
					stop: function(event, ui) {
						$('#mapOLDataDrop').removeClass('visible');
					}
				});

				$('#map_canvas').droppable( {
			      accept: '#dragLabel',
			      hoverClass: '',
			      drop: self.dataDrop
			    } );	
			},
			error: function() {
				console.error('failed to fetch collections');
			}
		});
	},
	
	drawDataSource: function(data)
	{
		dataDiv = '<div class="data-item" id="dragLabel" data="'+data.collectionid+'"><div class="data-icon"></div><div class="data-title">'+data.name+'</div></div>'
		this.$('.data-container').append(dataDiv);
	},
	
	dataDrop:function ( event, ui ) {
	  	var draggable = ui.draggable;
		collectionId = draggable.attr('data');
		app.addFromDataLibrary(collectionId);
		$(ui.draggable).css("display","none");
	},
	
	closeButtonClicked: function() {
		this.remove();
	},
	
	remove: function() {
		var self = this;
		$(self.el).animate({
		    left: -350,
		  }, 400, 'easeOutQuad', function() {
				_dataLibraryVisible = false;
				$(window).unbind();
				$(self.el).remove();
				return this;
		  });	
	},
});