window.MapTourView = window.PanelViewBase.extend({

	className: 'panel map-tour',
	
    events: {
		'click .btn.previous' : 'previousStep',
		'click .btn.next' : 'nextStep',
    },

    initialize: function(options) 
    {    	
    	MapTourView.__super__.initialize.call(this, options);
		this.vent = options.vent;
	    this.template = _.template(tpl.get('map-tour'));	

		_.bindAll(this, "updateMapInfo");
	 	options.vent.bind("updateMapInfo", this.updateMapInfo);
	 	this.step = 0;

		this.mapInfo = options.mapInfo;
	},

	updateMapInfo: function(mapInfo)
	{
		if (mapInfo) {
			this.mapInfo = mapInfo;
		}
		if (this.mapInfo.tour.steps.length < 2) {
			this.$('.step-buttons').hide();
		} else {
			this.$('.step-buttons').show();
		}

		this.setStep(0);
	},

	setStep: function(step)
	{
		this.step = step;
		var stepInfo = this.mapInfo.tour.steps[this.step];
		this.$('.step-body').html(stepInfo.body);
		this.setTitle(stepInfo.title || this.mapInfo.title);

    	for (var i = app.mapInfo.layers.length - 1; i >= 0; i--) {
    		var pointCollectionId = app.mapInfo.layers[i].pointCollection._id;
    		var el = this.$('.data-legend.' + pointCollectionId);
    		var visible = (stepInfo.layers.indexOf(i) != -1);
    		this.vent.trigger('toggleLayerVisibility', pointCollectionId, visible, true);
    	}
	},

	previousStep: function() 
	{
		if (this.step == 0) {
			this.setStep(this.mapInfo.tour.steps.length - 1);
		} else {
			this.setStep(this.step - 1);
		}
		return false;
	},

	nextStep: function() 
	{
		if (this.step == this.mapInfo.tour.steps.length - 1) {
			this.setStep(0);
		} else {
			this.setStep(this.step + 1);
		}
		return false;
	},

	render: function()
	{
		MapTourView.__super__.render.call(this);
		this.updateMapInfo();

		return this;
	}
});