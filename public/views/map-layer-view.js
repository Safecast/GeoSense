define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'text!templates/map-layer.html',
	'views/panel-view-base',
	'views/histogram-view',
	'views/legend-view',
	'lib/color-gradient/color-gradient',
], function($, _, Backbone, config, utils, templateHtml, PanelViewBase, HistogramView, LegendView, ColorGradient) {
    "use strict";

	var MapLayerView = Backbone.View.extend({

		className: 'map-layer',

	    events: {
			'click .toggle-layer': 'toggleLayerClicked',
			'click .show-layer-editor': 'showLayerEditorClicked',
			'click .show-layer-details': 'showLayerDetailsClicked',
			'click .show-layer-extents': 'showLayerExtentsClicked',
			'click .move-layer ': function() { return false; }
	    },

	    initialize: function(options) 
	    {
		    this.template = _.template(templateHtml);
		    this.legendViewOptions = {};
		    this.expandContent = true;

		    this.listenTo(this.model, 'change', this.modelChanged);
		    this.listenTo(this.model, 'toggle:enabled', this.updateEnabled);
		    this.listenTo(this.model, 'destroy', this.remove);

			this.listenTo(this.model.featureCollection, 'request', this.layerFeaturesRequest);
			this.listenTo(this.model.featureCollection, 'error', this.layerFeaturesRequestError);
			this.listenTo(this.model.featureCollection, 'sync', this.layerFeaturesSynced);
	    },

	    showSpinner: function()
	    {
	    	if (!this.spinner.is(':visible')) {
	    		this.spinner.css({opacity: 0}).show();	
	    	}
			this.spinner.stop().animate({opacity: 1}, 50);
	    },

	    hideSpinner: function()
	    {
	    	var self = this;
			this.spinner.stop().fadeOut(300, function() {
				//self.spinner.hide();
			});
	    },

	    layerFeaturesRequest: function(model, xhr, options)
	    {
	    	this.isLoading = true;
	    	this.updateStatus();
	    },

	    layerFeaturesRequestError: function(model, xhr, options)
	    {
	    	this.isLoading = false;
	    	this.updateStatus(__('failed'));
	    },

	    layerFeaturesSynced: function(model, resp, options)
	    {
	    	this.isLoading = false;
	    	this.updateStatus();
	    },	    

	    updateStatus: function(status) 
	    {
	    	var countStatus = '',
				progress = this.model.getFeatureCollectionAttr('progress'),
				featureCollection = this.model.featureCollection;

			if (this.isLoading || this.model.getDataStatus() != DataStatus.COMPLETE) {
		    	this.showSpinner();
			} else {
		    	this.hideSpinner();
			}

			if (!status) {
		    	switch (this.model.getDataStatus()) {
		    		case DataStatus.COMPLETE:
		    			if (this.model.isEnabled()) {
		    				if (featureCollection.initiallyFetched) {
								status = __('%(number)i of %(total)i', {
									number: formatLargeNumber(featureCollection.counts.original),
									total: formatLargeNumber(featureCollection.counts.full)
								});
								var url = featureCollection.url();
								if (this.model.attributes.featureCollection) {
									status += '&nbsp;&nbsp;<a target="_blank" class="muted download-collection ' + this.model.attributes.featureCollection._id +'" href="' 
										+ url + '"><span class="glyphicon glyphicon-download muted"></span></a>';		
								}
							} else {
			    				status = 'loading…';
							}
		    			} else {
		    				status = '';
		    			}
						break;
		    		case DataStatus.IMPORTING:
		    		case DataStatus.IMPORTING_INC:
		    			status = __(progress ? 'importing… %(count)s' : 'importing…', {
		    				count: formatLargeNumber(this.model.attributes.featureCollection.progress)
		    			});
						break;
		    		case DataStatus.UNREDUCED:
		    		case DataStatus.UNREDUCED_INC:
		    			status = __('queued for crunching…');
						break;
		    		case DataStatus.REDUCING:
		    		case DataStatus.REDUCING_INC:
		    			if (this.model.attributes.featureCollection.numBusy) {
			    			var percent = Math.floor(progress / this.model.attributes.featureCollection.numBusy * 100);
			    			status = __(progress ? 'crunching… %(percent)s%' : 'crunching…', {
			    				percent: percent
			    			});
			    			this.$('.progress .bar').css('width', percent + '%');
			    			this.$('.progress').show();
		    			} else {
			    			status = __('crunching…', {
			    			});
		    			}
						break;
		    	}
			}

	    	var el = this.$(".status .text");
	    	el.html(status);
	    },	    

	    render: function() 
	    {
	    	var self = this;
			this.$el.html(this.template());
			this.$el.attr('data-id', this.model.id);
			this.$el.attr('data-feature-collection-id', this.model.attributes.featureCollection._id);

			var stateIndicator = this.$('.state-indicator');
			if (stateIndicator.length) {
				this.spinner = stateIndicator.html(new Spinner({radius:4,length:0,width:4,color:'#888',lines:7,speed:1.5}).spin().el).hide();
			}
			
			// set up accordion group
			this.toggleEl = this.$(".collapse-toggle");
			this.collapseEl = this.$(".collapse");
			
			this.toggleEl.attr("href", "#collapse-" + this.className 
				+ '-' + (this.model.id || this.model.attributes.featureCollection._id));
			this.collapseEl.attr("id", "collapse-" + this.className 
				+ '-' + (this.model.id || this.model.attributes.featureCollection._id));

		
			// toggle initial state of accordion group
			var enabled = this.model.isEnabled();
			this.collapseEl.on('show', function() {
				if (!self.model.isEnabled()) {
					self.model.toggleEnabled(true);
				}
			});

			if (!this.model.parentMap) {
				this.$('.layer-tools').remove();
				this.$('.status').remove();
			} else {
				this.$('.status').toggle(enabled);
				if (!app.isMapAdmin()) {
					this.$('.admin-control').remove();
				}
			}

			this.$('.details').hide();
			this.populateFromModel(true);

			return this;
	    },

	    expand: function(animate)
	    {
	    	if (animate || animate == undefined) {
		    	if (!this.collapseEl.is('.in')) {
			    	this.collapseEl.collapse('show');
		    	}
	    	} else {
	    		this.collapseEl.addClass('in');
	    	}
	    	// class not set by Bootstrap if toggled like this
			this.toggleEl.removeClass('collapsed');
	    	return this;
	    },

	    collapse: function(animate)
	    {
	    	if (animate || animate == undefined) {
	    	if (this.collapseEl.is('.in')) {
	    		this.collapseEl.collapse('hide');
	    	}
	    	} else {
	    		this.collapseEl.addClass('collapse');
	    	}
	    	// class not set by Bootstrap if toggled like this
			this.toggleEl.addClass('collapsed');
	    	return this;
	    },

	    hide: function(duration)
	    {
	    	this.$el.hide(duration);
	    	return this;
	    },

	    show: function(duration)
	    {
	    	this.$el.show(duration);
	    	return this;
	    },

	    renderHistogram: function()
	    {
	    	if (this.histogramView) {
	    		this.histogramView.$el.remove();
	    	} else {
				this.histogramView = new HistogramView({model: this.model});
	    	}
			if (!this.model.canDisplayValues()
				|| !this.model.isNumeric()
				|| !this.model.getLayerOptions().histogram) return;
			
			this.$('.graphs').append(this.histogramView.el);
			this.histogramView.render().delegateEvents();
	    },

	    renderLegend: function()
	    {
	    	if (this.legendView) {
	    		this.legendView.$el.remove();
	    	} else {
				this.legendView = new LegendView(_.extend({},
					this.legendViewOptions, 
					{model: this.model}));
	    	}
			if (!this.model.canDisplayValues()) return;	
			this.$('.legend').append(this.legendView.el);
			this.legendView.render().delegateEvents();
	    },

	    setSuperView: function(superView) {
			this.listenTo(superView, 'panel:resize', this.panelViewResized);
	    },

		panelViewResized: function(panelView) 
		{
			if (this.histogramView) {
				this.histogramView.render();
			}
	    	if (this.legendView) {
				this.legendView.removePopover();
			}
		},

		updateEnabled: function(animate)
		{
			var enabled = this.model.isEnabled(),
				d = animate || animate == undefined ? 'fast' : 0;

	    	if (this.legendView) {
				this.legendView.removePopover();
			}

			this.$el.toggleClass('enabled', enabled);
			this.$el.toggleClass('disabled', !enabled);
			this.$('.toggle-layer').toggleClass('active', enabled);
			if (enabled) {
				this.$('.status').slideDown(d);
			} else {
				this.$('.status').slideUp(d);
			}

			if (!enabled || !this.expandContent) {
				this.collapse();
			} else {
				this.expand();
			}

			this.$('.layer-extents').toggle(enabled 
				&& this.model.getBbox().length > 0);
		},

		modelChanged: function(model)
		{
	    	if (this.legendView) {
				this.legendView.removePopover();
			}
			this.populateFromModel(
				this.model.hasChangedColors() 
				|| this.model.hasChanged('featureCollection.status')
				|| this.model.hasChanged('layerOptions.unit')
				|| this.model.hasChanged('layerOptions.histogram'));
		},

	    populateFromModel: function(renderSubViews)
	    {
	    	this.updateEnabled(false);
            if (renderSubViews) {
				this.renderHistogram();
				this.renderLegend();
			}
			this.updateStatus();
			this.$('.model-title').text(this.model.getDisplay('title'));

			this.$('.admin-control.layer-editor').toggle(app.isMapAdmin()
				&& this.model.getDataStatus() == DataStatus.COMPLETE);

			var collectionAttrs = this.model.attributes.featureCollection,
				description = this.model.getDisplay('description'),
				source = this.model.getDisplay('source'),
				sourceUrl = this.model.getDisplay('sourceUrl');

			if (description) {
				this.$('.description').html(description);
				this.$('.show-layer-details').show();
			} else {
				this.$('.description').hide();
				this.$('.show-layer-details').hide();
			}

			if (source || (collectionAttrs && collectionAttrs.sync)) {
				this.$('.source').show();
				var sourceLink = sourceUrl && sourceUrl.length ?
						'<a href="%(sourceUrl)s">%(source)s</a>'.format({sourceUrl: sourceUrl, source: source}) : source;
				if (source) {
					source = __('Source: %(source)s', {source: sourceLink});
				}
    			if (collectionAttrs.sync) {
					source += ' <span class="updated micro">(' + __('updated %(date)s', {
						date: new Date(
							collectionAttrs.reduce ? 
							(collectionAttrs.updatedAt < collectionAttrs.lastReducedAt || !collectionAttrs.lastReducedAt ?
								collectionAttrs.updatedAt : collectionAttrs.lastReducedAt) 
							: collectionAttrs.updatedAt)
								.format(locale.formats.DATE_SHORT)
					}) + ')</span>';
    			}
				this.$('.source').html(source);
			} else {
				this.$('.source').hide();
			}
	    },

		toggleLayerClicked: function(event)
		{
			this.model.toggleEnabled(!this.model.isEnabled());
			return false;
		},

		showLayerEditorClicked: function(event)
		{
			this.model.trigger('showMapLayerEditor');
			return false;
		},

		showLayerExtentsClicked: function(event)
		{
			app.mapView.zoomToExtent(this.model.attributes.featureCollection.bbox);
			return false;
		},

		showLayerDetailsClicked: function(event)
		{
			var self = this;
			this.$('.details').uiToggle({
				activate: this.$('.show-layer-details'),
				show: function() {
					self.expand();
				}
			});
			return false;
		}


	});

	return MapLayerView;
});
