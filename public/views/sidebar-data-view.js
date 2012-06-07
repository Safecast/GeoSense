window.SideBarDataView = Backbone.View.extend({

    tagName: 'div',
	className: 'sidebar-data',
	
    events: {
		'click #removeData:' : 'removeDataClicked',
		'click #editData:' : 'editDataClicked',
		'click #updateData' : 'updateDataClicked',

		'click .color-type:' : 'colorTypeChanged',
		'click .feature-type:' : 'featureTypeChanged',
		'click .legend-button:' : 'visibilityChanged',
		'click .visibility:' : 'visibilityChanged',
		
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
		
		this.colors = [];
		this.colorType = null;
		this.featureType = null;
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

		dataTitle += " ("+ formatLargeNumber(this.collection.fullCount) + ") " + "";

		this.$(".title").html(dataTitle);
		this.$(".title").attr("href", "#collapse" + this.collectionId);
		this.$("#collapse").attr("id", "collapse" + this.collectionId);
		
		if(!_admin) {
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
	
		this.$("#gradientEditor").gradientEditor({
				width: 220,  
				height: 30,
				stopWidth: 12,
				stopHeight: 10,
				initialColor: "#ff00ff",
				onChange: function() {},
				colors: [
					{position: 0.0, color: "#000000"},
					{position: 1.0, color: "#ffffff"}
				]
		});

		this.fetchParameters();
	
        return this;
    },

	fetchParameters: function()
	{	
		console.log('fetchParameters');

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

		this.colors = collection.options.colors;
		console.log(this.colors, 'CCCCC');
		this.colorType = collection.options.colorType;
		this.featureType = collection.options.featureType;
		this.visible = collection.options.visible;

		this.featureTypeChanged();
		this.colorTypeChanged();
		this.visibilityChanged();

		this.$("#colorInput").miniColors('value', this.colors[0].color);
		this.$("#colorInputLow").miniColors('value', this.colors[0].color);
		this.$("#colorInputHigh").miniColors('value', this.colors[this.colors.length - 1].color);
		
		console.log('setParameters', this.featureType);
		this.disableUpdateButton();
	},

	removeDataClicked: function()
	{
		var self = this;
		$(this.el).fadeOut('fast');
		self.collection.reset();
		self.collection.unbindCollection();
   	},

	updateDataClicked: function()
	{
		//build json and update
		var self = this;
		//this.collection.unbindCollection();
				
		if (this.colorType == ColorType.SOLID) {
			this.colors[0] = {color: this.$('#colorInput').val()};
		} else {
			this.colors[0] = {color: this.$('#colorInputLow').val(), position: 0.0};
		}
		this.colors[1] = {color: this.$('#colorInputHigh').val(), position: 1.0};
		
		var postData = {
			visible: this.visible,
			colorType: this.colorType,
			colors: this.colors,
			featureType: this.featureType
		};
		
		$.ajax({
			type: 'POST',
			url: '/api/updatemapcollection/' + _mapId + '/' + this.collection.collectionId,
			dataType: 'json',
			data: postData,
			success: function(data) {
				self.disableUpdateButton();
				self.updateLegend();
				self.vent.trigger("redrawCollection", {collectionId: self.collectionId, updateObject: postData});
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

	updateLegend: function() {
		if (this.visible) {
			$(this.el).addClass('visible');
			$(this.el).removeClass('hidden');
		} else {
			$(this.el).removeClass('visible');
			$(this.el).addClass('hidden');
		}

		switch(this.colorType) {
			case ColorType.SOLID: 
				this.$('.legend-button').css('background-color', this.color);
				break;
			case ColorType.LINEAR_GRADIENT: 
				this.$('.legend-button').css('background-color', this.colorLow)	
				break;
		}

		for (t in FeatureType) {
			if (FeatureType[t] == this.featureType) {
				this.$('.legend-button').addClass(FeatureType[t]);
			} else {
				this.$('.legend-button').removeClass(FeatureType[t]);
			}
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

	featureTypeChanged: function(evt)
	{
		var self = this;
		if (evt) {
			var val = $(evt.currentTarget).val();
			if (val == this.colorType) return;
			this.featureType = val;
			this.enableUpdateButton();
		}

		this.$('.feature-type').each(function() {
			if ($(this).val() == self.featureType) {
				$(this).addClass('active');
			} else {
				$(this).removeClass('active');
			}
		});

		this.$('.feature-settings').each(function() {
			if ($(this).hasClass(self.featureType)) {
				$(this).show();
			} else {
				$(this).hide();
			}
		});
	},

	colorTypeChanged: function(evt)
	{
		var self = this;
		if (evt) {
			var val = $(evt.currentTarget).val();
			if (val == this.colorType) return;
			this.colorType = val;
			this.enableUpdateButton();
		}

		this.$('.color-type').each(function() {
			if ($(this).val() == self.colorType) {
				$(this).addClass('active');
			} else {
				$(this).removeClass('active');
			}
		});

		switch (this.colorType) {
			case ColorType.SOLID: 
				this.$('.color-gradient').hide();
				this.$('.color-solid').show();
				this.updateLegend();
				break;
			case ColorType.LINEAR_GRADIENT: 
			  	this.$('.color-gradient').show();
				this.$('.color-solid').hide();
				this.updateLegend();
			  	break;
		}
	},

	visibilityChanged: function(evt)
	{
		var self = this;
		if (evt) {
			if (!$(evt.currentTarget).hasClass('toggle')) {
				var val = $(evt.currentTarget).val();
				val = Number(val) != 0;
				if (val == this.visible) return;
				this.visible = val;
			} else {
				this.visible = !this.visible;
			}
			this.enableUpdateButton();
			this.vent.trigger("toggleLayerVisibility", this.collectionId, this.visible);
		}

		this.$('.visibility').each(function() {
			var val = $(this).val();
			val = Number(val) != 0;
			if (val == self.visible) {
				$(this).addClass('active');
			} else {
				$(this).removeClass('active');
			}
		});

		this.updateLegend();
	}

});