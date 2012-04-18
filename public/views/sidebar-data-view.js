window.SideBarDataView = Backbone.View.extend({

    tagName: 'div',
	className: 'sidebar-data',
	
    events: {
		'click #removeData:' : 'removeDataClicked',
		'click #editData:' : 'editDataClicked',
		'click #updateData' : 'updateDataClicked',
		'click #toggleVisible:' : 'toggleVisibleClicked',
		'click #toggleHidden:' : 'toggleHiddenClicked',
		'click #singleColor:' : 'singleColorClicked',
		'click #scaleColor:' : 'scaleColorClicked',
		'click #circlesButton:' : 'circlesButtonClicked',
		'click #pixelsButton:' : 'pixelsButtonClicked',
		
		'click #colorInput' : 'colorInputClicked',
		'click #colorInputLow' : 'colorInputLowClicked',
		'click #colorInputHigh' : 'colorInputHighClicked',
		
    },

    initialize: function(options) {
		this.vent = options.vent;
	    this.template = _.template(tpl.get('sidebar-data'));
		this.collectionId = options.collectionId;
		this.title = options.title;
		this.dataLength = options.dataLength;
		
		this.color = '';
		this.colorLow = '';
		this.colorHigh = '';
		this.colorType = 1;
		this.displayType = 2;
		this.visible = true;
		
		this.collection.bind('add',   this.addOne, this);
		this.collection.bind('reset', this.addAll, this);
		
    },

    render: function() {
		var self = this;
		$(this.el).html(this.template());
				
		if(this.title != '')
		{
			dataTitle = this.title;
		}
		else
		{
			dataTitle = "Untitled Data";
		}
		
		dataTitle += " ("+ this.collection.length + ") <div class='data-color' id='dataColor'></div>";
		
		this.$("a").html(dataTitle);
		this.$("a").attr("href", "#collapse" + this.collectionId);
		this.$("#collapse").attr("id", "collapse" + this.collectionId);
		
		if(!_admin)
		{
			this.$('#adminDataControls').remove();
		}
		
		this.$("#colorInput").miniColors({
		    change: function(hex, rgb) 
			{ 
				self.enableUpdateButton();
			}});
		this.$("#colorInput").miniColors('value','#0aa5ff');
		
		this.$("#colorInputLow").miniColors({
		    change: function(hex, rgb) 
			{ 
				self.enableUpdateButton();
			}});
		this.$("#colorInputLow").miniColors('value','#333');
		
		this.$("#colorInputHigh").miniColors({
		    change: function(hex, rgb) 
			{ 
				self.enableUpdateButton();
			}});
		this.$("#colorInputHigh").miniColors('value','#fff');
	
		this.fetchParameters();
	
		
        return this;
    },

	fetchParameters: function()
	{
		var self = this;
		$.ajax({
			type: 'GET',
			url: '/api/map/' + _mapId,
			success: function(data) {
				
				$.each(data[0].collections, function(key, collection) { 
					$.each(collection, function(key, val) { 
						if(key == 'collectionid')
						{
							if(self.collectionId == val)
								self.setParameters(collection);
								_boundCollections[self.collectionId] = collection;
								
						}	
					});
				});
				
			},
			error: function() {
				console.error('failed to fetch map collection');
			}
		});
	},
	
	setParameters: function(collection)
	{
		var self = this;
					
		this.color = collection.color;
		this.colorLow = collection.colorLow;
		this.colorHigh = collection.colorHigh;
		this.colorType = collection.colorType;
		this.displayType = collection.displayType;
		
		switch(this.colorType)
		{
		case "1": // Single Color
		  	this.singleColorClicked();
			this.$('#scaleColor').removeClass('active');
			this.$('#singleColor').removeClass('active');
			this.$('#singleColor').addClass('active');
			this.setLegendColor();
		  break;
		case "2": // Color Range
		  	this.scaleColorClicked();
			this.$('#singleColor').removeClass('active');
			this.$('#scaleColor').removeClass('active');
			this.$('#scaleColor').addClass('active');
			this.setLegendColor();
		  break;
		}

		switch(this.displayType)
		{
		case "1": // Pixels
		  	this.pixelsButtonClicked();
		  break;
		case "2": // Circles
		  	this.circlesButtonClicked();
		  break;
		}
		
		this.$("#colorInput").miniColors('value',this.color);
		this.$("#colorInputLow").miniColors('value',this.colorLow);
		this.$("#colorInputHigh").miniColors('value',this.colorHigh);
		
		this.disableUpdateButton();
	},
	
	setLegendColor: function()
	{
		if(this.colorType == 1)
		{
			this.$('#dataColor').css('background-color',this.color)	
		}
		else
		{
			this.$('#dataColor').css('background-color',this.colorLow)	
		}
	},

	addOne: function(data) {
		var self = this;
    },

    addAll: function() {
      var self = this;
		this.collection.each(function(data){ 
		self.addOne(data);
	 	});
    },

	enableUpdateButton: function()
	{
		this.$('#updateData').removeClass('disabled');
		this.$('#updateData').addClass('btn-primary');
	},
	
	disableUpdateButton: function()
	{
		this.$('#updateData').removeClass('btn-primary');
		this.$('#updateData').addClass('disabled');
	},

	colorInputClicked: function()
	{
		this.enableUpdateButton();
	},
	
	colorInputLowClicked: function()
	{
		this.enableUpdateButton();
	},
	
	colorInputHighClicked: function()
	{
		this.enableUpdateButton();
	},

	circlesButtonClicked: function()
	{
		this.enableUpdateButton();
		this.$('#circlesButton').addClass('active');
		this.$('#pixelsButton').removeClass('active');
		this.displayType = 2;
	},
	
	pixelsButtonClicked: function()
	{
		this.enableUpdateButton();
		this.$('#circlesButton').removeClass('active');
		this.$('#pixelsButton').addClass('active');
		this.displayType = 1;
	},

	singleColorClicked: function()
	{
		this.enableUpdateButton();
		$('.color-scale').hide();
		$('.color-single').show();
		this.colorType = 1;
	},

	scaleColorClicked: function()
	{
		this.enableUpdateButton();
		$('.color-scale').show();
		$('.color-single').hide();
		this.colorType = 2;
	},

	removeDataClicked: function()
	{
		var self = this;
		
		$(this.el).fadeOut('fast',function()
		{
			self.collection.unbindCollection();
		});
		self.collection.reset();
   	},

	updateDataClicked: function()
	{
		//build json and update
		var self = this;
		this.collection.unbindCollection();
		
		this.color = this.$('#colorInput').val();
		this.colorLow = this.$('#colorInputLow').val();
		this.colorHigh = this.$('#colorInputHigh').val();
		
		var updateObject = [{
				collectionid:this.collectionId,
				colorType:this.colorType,
				color: this.color,
				colorLow: this.colorLow,
				colorHigh: this.colorHigh,
				displayType:this.displayType
			}];
		
			$.ajax({
					type: 'POST',
					url: '/api/bindmapcollection/' + _mapId,
					dataType: 'json',
					data: { jsonpost: updateObject },
					success: function(data) {
						self.disableUpdateButton();
						self.setLegendColor();
					},
					error: function() {
						console.error('failed to join map with collection');
					}
				});	
			
	},

	editDataClicked: function()
	{
		var self = this;
		
		if(this.editDataView)
			this.editDataView.remove();
			
		this.editDataView = new EditDataView({vent: this.vent, collection:this.collection});
        $('body').append(this.editDataView.render().el);
		$('#editDataModal').modal('toggle');
   	},

	displayDataState: function(state)
	{
		console.log('Currently: ' + state);
	},

	toggleVisibleClicked: function()
	{
		this.toggleVisibility(1);
	},
	
	toggleHiddenClicked: function()
	{
		this.toggleVisibility(0)
	},
	
	toggleVisibility: function(type)
	{
		this.vent.trigger("toggleLayerVisibility", this.collectionId, type);
	}

});