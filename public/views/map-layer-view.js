define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'utils',
	'permissions',
	'text!templates/map-layer.html',
	'views/panel-view-base',
	'views/graphs/histogram-view',
	'views/legend-view',
	'mixins/spinner-mixin',
	'mixins/in-place-editor-mixin',
	'mixins/timeout-queue-mixin',
	'lib/color-gradient/color-gradient',
	'moment'
], function($, _, Backbone, config, utils, permissions, templateHtml, 
	PanelViewBase, HistogramView, LegendView, 
	SpinnerMixin, InPlaceEditorMixin, TimeoutQueueMixin,
	ColorGradient, moment) {
    "use strict";

	var MapLayerView = Backbone.View.extend({

		className: 'map-layer',
	    showEffect: 'slideDown',
	    hideEffect: 'slideUp',

	    events: {
			'click .toggle-layer': 'toggleLayerClicked',
			'click .show-layer-editor': 'showLayerEditorClicked',
			'click .show-layer-graphs': 'showLayerGraphsClicked',
			'click .show-layer-details': 'showLayerDetailsClicked',
			'click .show-layer-extents': 'showLayerExtentsClicked',
			'click .edit-collection': 'editCollectionClicked',
			'click .histogram': 'histogramClicked',
			'click .move-layer ': function() { return false; }
	    },

	    initialize: function(options) 
	    {
		    this.template = _.template(templateHtml);
		    this.legendViewOptions = {};
		    this.expandContent;
		    this.expandLayerDetails = false;
			this.subViewsRendered = false;
			this.createTimeoutQueue('redrawGraphs', 250);

		    this.listenTo(this.model, 'change', this.modelChanged);
		    this.listenTo(this.model, 'toggle:enabled', this.updateEnabled);
		    this.listenTo(this.model, 'destroy', this.remove);

			this.listenTo(this.model.mapFeatures, 'request', this.layerFeaturesRequest);
			this.listenTo(this.model.mapFeatures, 'error', this.layerFeaturesRequestError);
			this.listenTo(this.model.mapFeatures, 'sync', this.layerFeaturesSynced);

			this.listenTo(this.model.featureCollection, 'sync', function() {
				this.populateFromModel(false);
			});
	    },

	    sharingToggleClicked: function(evt)
	    {
	    	this.$('.sharing-status').attr('disabled', true);
	    	this.model.featureCollection.save(
	    		{sharing: $(evt.currentTarget).attr('data-value')}, {patch: true});
	    	this.hidePopovers();
	    	return false;
	    },

	    hidePopovers: function()
	    {
			this.superView.$el.parent().find('.sharing-status').popover('hide');
			this.superView.$el.parent().find('.popover').remove();
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
				mapFeatures = this.model.mapFeatures;

			if (this.isLoading || this.model.getDataStatus() != DataStatus.COMPLETE) {
		    	this.showSpinner();
			} else {
		    	this.hideSpinner();
			}

			if (!status) {
		    	switch (this.model.getDataStatus()) {
		    		case DataStatus.COMPLETE:
		    			if (this.model.isEnabled()) {
		    				var c = mapFeatures.initiallyFetched ? 
		    					mapFeatures.getCounts() : this.model.getCounts();
		    				if (c) {
		    					if (formatLargeNumber(c.original) != undefined) {
									status = __('%(number)i of %(total)i', {
										number: formatLargeNumber(c.original),
										total: formatLargeNumber(c.full)
									});
		    					} else {
									status = (c.full != 1 ? __('%(total)i %(itemTitlePlural)s') : __('%(total)i %(itemTitle)s')).format({
										total: formatLargeNumber(c.full),
										itemTitle: this.model.getDisplay('itemTitle'),
										itemTitlePlural: this.model.getDisplay('itemTitlePlural'),
									});
		    					}
								if (mapFeatures.initiallyFetched) {
									var url = mapFeatures.url();
									status += '&nbsp;&nbsp;<a target="_blank" class="muted download-collection"'+'" href="' 
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
			this.$('.has-tooltip').tooltip({container: 'body'});

			var stateIndicator = this.$('.state-indicator');
			if (stateIndicator.length) {
				this.initSpinner(stateIndicator);
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
			if (this.expandContent == undefined) {
				this.expandContent = enabled;
			}
			this.collapseEl.on('hide.bs.collapse', function() {
				self.trigger('collapse');
			});
			this.collapseEl.on('show.bs.collapse', function() {
				self.trigger('expand');
				if (!self.model.isEnabled()) {
					self.model.toggleEnabled(true);
				}
			});

			if (!this.model.parentMap) {
				this.$('.layer-tools .map-tool').remove();
				this.$('.collapse-content').prepend(this.$('.status').remove());
				if (!app || !app.mapView) {
					this.$('.layer-tools .library-map-tool').remove();
				}
			} else {
				this.$('.layer-tools .library-tool').remove();
				this.$('.status').toggle(enabled);
			}
			this.$layerTools = this.$('.layer-tools').clone();

			this.populateFromModel(this.expandContent);
			this.$('.details').toggle(this.expandLayerDetails);
			this.$('.has-tooltip').tooltip({ delay: 200, container: 'body' });

			this.initInPlaceEditing();

			return this;
	    },

	    initInPlaceEditing: function()
	    {
	    	var self = this;
			this.on('inplace:enter', function() {
				self.$('.edit-collection').tooltip('hide');
				self.$('.edit-collection').attr('disabled', true);
			});
			this.on('inplace:changed', function(data) {
				self.model.featureCollection.save(data, {patch: true});
			});
			this.on('inplace:exit', function() {
				self.$('.edit-collection').attr('disabled', false);
			});
	    },

	    isExpanded: function()
	    {
			return this.collapseEl.is('.in');
	    },

	    expand: function(animate)
	    {
	    	if (animate || animate == undefined) {
		    	if (!this.isExpanded()) {
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
		    	if (this.isExpanded()) {
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
	    	if (!duration) {
		    	this.$el.hide();
		    	return this;
	    	}
	    	this.$el[this.hideEffect](duration);
	    	return this;
	    },

	    show: function(duration)
	    {
	    	if (!duration) {
		    	this.$el.show();
		    	return this;
	    	}
	    	this.$el[this.showEffect](duration);
	    	return this;
	    },

	    renderHistogram: function()
	    {
	    	if (!this.model.histogram) return;
	    	var self = this;
	    	if (!this.histogramView) {
		    	this.$('.graphs').hide();
				this.listenToOnce(this.model.histogram, 'sync', function() {
					if (this.isExpanded()) {
						this.$('.graphs').slideDown('fast');
					} else {
						this.$('.graphs').show();
					}
					this.histogramView.renderGraph();
				});
				this.histogramView = new HistogramView(
					{model: this.model, collection: this.model.histogram, renderAxes: false});

				this.$('.graphs').append(self.histogramView.el);
	    	}
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

	    setSuperView: function(superView) 
	    {
	    	this.superView = superView;
			this.listenTo(superView, 'panel:resize', this.panelViewResized);
	    },

		panelViewResized: function(panelView) 
		{
			var self = this;
			if (this.histogramView) {
				this.queueTimeout('redrawGraphs', function() {
					self.histogramView.fillExtents().redrawGraphIfVisible();
				});
			}
	    	if (this.legendView) {
				this.legendView.removePopover();
			}
		},

		updateEnabled: function(animate)
		{
			var enabled = this.model.isEnabled(),
				d = animate || animate == undefined ? 'fast' : 0;

	    	if (enabled && !self.subViewsRendered) {
	    		this.renderSubViews();
	    	}

	    	if (this.legendView) {
				this.legendView.removePopover();
			}

			this.$el.toggleClass('enabled', enabled);
			this.$el.toggleClass('disabled', !enabled);
			if (this.model.parentMap) {
				this.$('.toggle-layer').toggleClass('active', enabled);
			}
			if (enabled) {
				this.$('.status').slideDown(d);
			} else {
				this.$('.status').slideUp(d);
			}

			if (!enabled || !this.expandContent) {
				this.collapse(animate);
			} else {
				this.expand(animate);
			}

			this.$('.layer-tools .show-layer-graphs').attr('disabled', !enabled);
			this.$('.layer-tools .show-layer-extents').attr('disabled', !enabled);
		},

		modelChanged: function(model, options)
		{
			if (options.patch || options.poll) {
				this.updateStatus();
				return; // wait for sync for complete update
			}
	    	if (this.legendView) {
				this.legendView.removePopover();
			}

			this.populateFromModel(
				this.model.hasChangedColors() 
				|| this.model.hasChanged('featureCollection.status')
				|| this.model.hasChanged('layerOptions.unit')
				|| this.model.hasChanged('layerOptions.histogram'));
		},

		renderSubViews: function() 
		{
			this.renderHistogram();
			this.renderLegend();
			this.subViewsRendered = true;
		},

		remove: function()
		{
			if (this.histogramView) {
				this.histogramView.remove();
			}
			if (this.legendView) {
				this.legendView.remove();
			}
			MapLayerView.__super__.remove.apply(this, arguments);
		},

	    populateFromModel: function(renderSubViews)
	    {
	    	var self = this;

			this.$('.model-title').text(this.model.getDisplay('title'));
			this.$('.layer-tools').replaceWith(this.$layerTools.clone());
	    	this.updateEnabled(false);
            if (renderSubViews) {
            	this.renderSubViews();
			}
			this.updateStatus();

			var collectionAttrs = this.model.attributes.featureCollection,
				description = this.model.getDisplay('description'),
				source = this.model.getDisplay('source'),
				sourceUrl = this.model.getDisplay('sourceUrl');

			this.$('.description').html(description);
			if (description) {
				this.$('.description').show();
			} else {
				this.$('.description').hide();
				this.$('.layer-tools .show-layer-details').remove();
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
						date: moment(
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

			if (this.model.parentMap) {
				if (!app.isMapAdmin()) {
					this.$('.layer-tools .admin-control').remove();
				} else if (!this.model.getDataStatus() == DataStatus.COMPLETE) {
					this.$('.layer-tools .admin-control.layer-editor').remove();
				}
				if (!this.model.hasGraphs()) {
					this.$('.layer-tools .show-layer-graphs').remove();
				}
				if (!this.model.getBbox().length) {
					this.$('.layer-tools .show-layer-extents').remove();
				}
			} else {
				if (!permissions.canAdminModel(this.model.featureCollection)) {
					this.$('.layer-tools .admin-control').remove();
				} else {
					var popoverTitle, popoverContent;
					switch (this.model.attributes.featureCollection.sharing) {
						case SharingType.PRIVATE:
							this.$('.is-public').hide();
							this.$('.is-private').show();
							popoverTitle = __('This collection is private.');
							popoverContent = 
								'<p class="micro">' + __('Only you can use this data on your maps.') + '</p>'
								+__('<a href="#" class="btn btn-warning btn-sm sharing-toggle" data-value="' + SharingType.WORLD +'"><span class="glyphicon glyphicon-globe"></span> Allow everybody to use collection</a>')
							break;
						case SharingType.WORLD:
							this.$('.is-private').hide();
							this.$('.is-public').show();
							popoverTitle = __('This collection is public.');
							popoverContent = 
								'<p class="micro">' + __('Everybody can currently add this data to their own maps.') + '</p>'
								+__('<a href="#" class="btn btn-danger btn-sm sharing-toggle make-private" data-value="' + SharingType.PRIVATE +'""><span class="glyphicon glyphicon-lock"></span> Make this collection private</a>')
							break;
					}

					this.$('.sharing-status').popover('destroy');
			    	this.$('.sharing-status').attr('disabled', false);
					this.$('.sharing-status').popover({
						animation: false,
						content: popoverContent,
						html: popoverContent,
						title: popoverTitle,
						container: self.superView.$el,
						placement: "bottom"
					}).on('show.bs.popover', function(evt) {
						self.hidePopovers();
					}).on('shown.bs.popover', function(evt) {
						$('.sharing-toggle').click(function(evt) {
							return self.sharingToggleClicked(evt);
						});
						evt.stopPropagation();
					});
				}
			}

	    },

		toggleLayerClicked: function(event)
		{
			if (!this.model.parentMap) {
				if (!this.isExpanded()) {
					this.expand();
				} else {
					this.collapse();
				}
				return false;
			}
			this.model.toggleEnabled(!this.model.isEnabled());
			return false;
		},

		showLayerEditorClicked: function(event)
		{
			this.model.trigger('showMapLayerEditor');
			return false;
		},

		showLayerGraphsClicked: function(event)
		{
			this.model.trigger('showMapLayerGraphs');
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
		},

		editCollectionClicked: function(evt)
		{
			this.toggleInPlaceEditMode();
		},

		histogramClicked: function(evt)
		{	
			if (this.model.parentMap) {
				app.showMapLayerGraphs(this.model).toggleGraphView('histogram');
			}
		},


	});

	_.extend(MapLayerView.prototype, SpinnerMixin);
	_.extend(MapLayerView.prototype, InPlaceEditorMixin);
    _.extend(MapLayerView.prototype, TimeoutQueueMixin);

	return MapLayerView;
});
