window.MapGEView = window.MapViewBase.extend({

    tagName: 'div',
	className: 'map-view',

	addFeatures: {
	},
	
    initialize: function(options) {
		MapGEView.__super__.initialize.call(this, options);
	    this.template = _.template(tpl.get('map-ge'));
	
		/*
		_.bindAll(this, "updateMapStyle");
	 	options.vent.bind("updateMapStyle", this.updateMapStyle);
	
		_.bindAll(this, "redrawMap");
	 	options.vent.bind("redrawMap", this.redrawMap);
				
		Feature = OpenLayers.Feature.Vector;
		Geometry = OpenLayers.Geometry;
		Rule = OpenLayers.Rule;
		Filter = OpenLayers.Filter;
		
		previousKey = 0;
		scope = this;
		OpenLayers.ImgPath = "/assets/openlayers-light/";	
		*/
    },

    render: function() {
		$(this.el).html(this.template());				
        return this;
    },

	getVisibleMapArea: function() {
	},

	start: function(mapStyle) {
		var self = this;
							        
	},
	
});