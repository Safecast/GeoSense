define(["jquery","underscore","backbone","config","utils","permissions","text!templates/map-layer.html","views/panel-view-base","views/graphs/histogram-view","views/legend-view","mixins/spinner-mixin","mixins/in-place-editor-mixin","mixins/timeout-queue-mixin","lib/color-gradient/color-gradient","moment"],function(e,t,n,r,i,s,o,u,a,f,l,c,h,p,d){var v=n.View.extend({className:"map-layer",showEffect:"slideDown",hideEffect:"slideUp",events:{"click .toggle-layer":"toggleLayerClicked","click .show-layer-editor":"showLayerEditorClicked","click .show-layer-graphs":"showLayerGraphsClicked","click .show-layer-details":"showLayerDetailsClicked","click .show-layer-extents":"showLayerExtentsClicked","click .edit-collection":"editCollectionClicked","click .histogram":"histogramClicked","click .move-layer ":function(){return!1}},initialize:function(e){this.template=t.template(o),this.legendViewOptions={},this.expandContent,this.expandLayerDetails=!1,this.subViewsRendered=!1,this.createTimeoutQueue("redrawGraphs",250),this.listenTo(this.model,"change",this.modelChanged),this.listenTo(this.model,"toggle:enabled",this.updateEnabled),this.listenTo(this.model,"destroy",this.remove),this.listenTo(this.model.mapFeatures,"request",this.layerFeaturesRequest),this.listenTo(this.model.mapFeatures,"error",this.layerFeaturesRequestError),this.listenTo(this.model.mapFeatures,"sync",this.layerFeaturesSynced),this.listenTo(this.model.featureCollection,"sync",function(){this.populateFromModel(!1)})},sharingToggleClicked:function(t){return this.$(".sharing-status").attr("disabled",!0),this.model.featureCollection.save({sharing:e(t.currentTarget).attr("data-value")},{patch:!0}),this.hidePopovers(),!1},hidePopovers:function(){this.superView.$el.parent().find(".sharing-status").popover("hide"),this.superView.$el.parent().find(".popover").remove()},layerFeaturesRequest:function(e,t,n){this.isLoading=!0,this.updateStatus()},layerFeaturesRequestError:function(e,t,n){this.isLoading=!1,this.updateStatus(__("failed"))},layerFeaturesSynced:function(e,t,n){this.isLoading=!1,this.updateStatus()},disableGraphs:function(){this.$(".show-layer-graphs").remove()},updateStatus:function(e){var t="",n=this.model.getFeatureCollectionAttr("progress"),r=this.model.mapFeatures;this.isLoading||this.model.getDataStatus()!=DataStatus.COMPLETE?this.showSpinner():this.hideSpinner();if(!e)switch(this.model.getDataStatus()){case DataStatus.COMPLETE:if(this.model.isEnabled()){var i=r.initiallyFetched?r.getCounts():this.model.getCounts();if(i){formatLargeNumber(i.original)!=undefined?e=__("%(number)i of %(total)i",{number:formatLargeNumber(i.original),total:formatLargeNumber(i.full)}):e=(i.full!=1?__("%(total)i %(itemTitlePlural)s"):__("%(total)i %(itemTitle)s")).format({total:formatLargeNumber(i.full),itemTitle:this.model.getDisplay("itemTitle"),itemTitlePlural:this.model.getDisplay("itemTitlePlural")});if(r.initiallyFetched){var s=r.url();e+='&nbsp;&nbsp;<a target="_blank" class="muted download-collection"" href="'+s+'"><span class="glyphicon glyphicon-download muted"></span></a>'}}else e="loading…"}else e="";break;case DataStatus.IMPORTING:case DataStatus.IMPORTING_INC:e=__(n?"importing… %(count)s":"importing…",{count:formatLargeNumber(this.model.attributes.featureCollection.progress)});break;case DataStatus.UNREDUCED:case DataStatus.UNREDUCED_INC:e=__("queued for crunching…");break;case DataStatus.REDUCING:case DataStatus.REDUCING_INC:if(this.model.attributes.featureCollection.numBusy){var o=Math.floor(n/this.model.attributes.featureCollection.numBusy*100);e=__(n?"crunching… %(percent)s%":"crunching…",{percent:o}),this.$(".progress .bar").css("width",o+"%"),this.$(".progress").show()}else e=__("crunching…",{})}var u=this.$(".status .text");u.html(e)},render:function(){var e=this;this.$el.html(this.template()),this.$el.attr("data-id",this.model.id),this.$el.attr("data-feature-collection-id",this.model.attributes.featureCollection._id),this.$(".has-tooltip").tooltip({container:"body"});var t=this.$(".state-indicator");t.length&&this.initSpinner(t),this.toggleEl=this.$(".collapse-toggle"),this.collapseEl=this.$(".collapse"),this.toggleEl.attr("href","#collapse-"+this.className+"-"+(this.model.id||this.model.attributes.featureCollection._id)),this.collapseEl.attr("id","collapse-"+this.className+"-"+(this.model.id||this.model.attributes.featureCollection._id));var n=this.model.isEnabled();return this.expandContent==undefined&&(this.expandContent=n),this.collapseEl.on("hide.bs.collapse",function(){e.trigger("collapse")}),this.collapseEl.on("show.bs.collapse",function(){e.trigger("expand"),e.model.isEnabled()||e.model.toggleEnabled(!0)}),this.model.parentMap?(this.$(".library-tool").remove(),this.$(".status").toggle(n),app.isMapAdmin()||this.$(".admin-control").remove()):(this.$(".map-tool").remove(),this.$(".collapse-content").prepend(this.$(".status").remove()),(!app||!app.mapView)&&this.$(".library-map-tool").remove()),this.populateFromModel(this.expandContent),this.$(".details").toggle(this.expandLayerDetails),this.$(".has-tooltip").tooltip({delay:200,container:"body"}),this.initInPlaceEditing(),this},initInPlaceEditing:function(){var e=this;this.on("inplace:enter",function(){e.$(".edit-collection").tooltip("hide"),e.$(".edit-collection").attr("disabled",!0)}),this.on("inplace:changed",function(t){e.model.featureCollection.save(t,{patch:!0})}),this.on("inplace:exit",function(){e.$(".edit-collection").attr("disabled",!1)})},isExpanded:function(){return this.collapseEl.is(".in")},expand:function(e){return e||e==undefined?this.isExpanded()||this.collapseEl.collapse("show"):this.collapseEl.addClass("in"),this.toggleEl.removeClass("collapsed"),this},collapse:function(e){return e||e==undefined?this.isExpanded()&&this.collapseEl.collapse("hide"):this.collapseEl.addClass("collapse"),this.toggleEl.addClass("collapsed"),this},hide:function(e){return e?(this.$el[this.hideEffect](e),this):(this.$el.hide(),this)},show:function(e){return e?(this.$el[this.showEffect](e),this):(this.$el.show(),this)},renderHistogram:function(){if(!this.model.histogram)return;var e=this;this.histogramView||(this.$(".graphs").hide(),this.listenToOnce(this.model.histogram,"sync",function(){this.isExpanded()?this.$(".graphs").slideDown("fast"):this.$(".graphs").show(),this.histogramView.renderGraph()}),this.histogramView=new a({model:this.model,collection:this.model.histogram,renderAxes:!1}),this.$(".graphs").append(e.histogramView.el))},renderLegend:function(){this.legendView?this.legendView.$el.remove():this.legendView=new f(t.extend({},this.legendViewOptions,{model:this.model}));if(!this.model.canDisplayValues())return;this.$(".legend").append(this.legendView.el),this.legendView.render().delegateEvents()},setSuperView:function(e){this.superView=e,this.listenTo(e,"panel:resize",this.panelViewResized)},panelViewResized:function(e){var t=this;this.histogramView&&this.queueTimeout("redrawGraphs",function(){t.histogramView.fillExtents().redrawGraphIfVisible()}),this.legendView&&this.legendView.removePopover()},updateEnabled:function(e){var t=this.model.isEnabled(),n=e||e==undefined?"fast":0;t&&!self.subViewsRendered&&this.renderSubViews(),this.legendView&&this.legendView.removePopover(),this.$el.toggleClass("enabled",t),this.$el.toggleClass("disabled",!t),this.model.parentMap&&this.$(".toggle-layer").toggleClass("active",t),t?this.$(".status").slideDown(n):this.$(".status").slideUp(n),!t||!this.expandContent?this.collapse(e):this.expand(e),this.$(".show-layer-graphs").attr("disabled",!t),this.$(".show-layer-extents").toggle(t&&this.model.getBbox().length>0)},modelChanged:function(e,t){if(t.patch||t.poll){this.updateStatus();return}this.legendView&&this.legendView.removePopover(),this.populateFromModel(this.model.hasChangedColors()||this.model.hasChanged("featureCollection.status")||this.model.hasChanged("layerOptions.unit")||this.model.hasChanged("layerOptions.histogram"))},renderSubViews:function(){this.renderHistogram(),this.renderLegend(),this.subViewsRendered=!0},remove:function(){this.histogramView&&this.histogramView.remove(),this.legendView&&this.legendView.remove(),v.__super__.remove.apply(this,arguments)},populateFromModel:function(t){var n=this;this.updateEnabled(!1),t&&this.renderSubViews(),this.updateStatus(),this.$(".model-title").text(this.model.getDisplay("title")),this.$(".admin-control.layer-editor").toggle(this.model.parentMap&&app.isMapAdmin()&&this.model.getDataStatus()==DataStatus.COMPLETE);var r=this.model.attributes.featureCollection,i=this.model.getDisplay("description"),o=this.model.getDisplay("source"),u=this.model.getDisplay("sourceUrl");this.$(".description").html(i),i?(this.$(".description").show(),this.$(".show-layer-details").show()):(this.$(".description").hide(),this.$(".show-layer-details").hide());if(o||r&&r.sync){this.$(".source").show();var a=u&&u.length?'<a href="%(sourceUrl)s">%(source)s</a>'.format({sourceUrl:u,source:o}):o;o&&(o=__("Source: %(source)s",{source:a})),r.sync&&(o+=' <span class="updated micro">('+__("updated %(date)s",{date:d(r.reduce?r.updatedAt<r.lastReducedAt||!r.lastReducedAt?r.updatedAt:r.lastReducedAt:r.updatedAt).format(locale.formats.DATE_SHORT)})+")</span>"),this.$(".source").html(o)}else this.$(".source").hide();if(!this.model.parentMap)if(!s.canAdminModel(this.model.featureCollection))this.$(".admin-control").remove();else{var f,l;switch(this.model.attributes.featureCollection.sharing){case SharingType.PRIVATE:this.$(".is-public").hide(),this.$(".is-private").show(),f=__("This collection is private."),l='<p class="micro">'+__("Only you can use this data on your maps.")+"</p>"+__('<a href="#" class="btn btn-warning btn-sm sharing-toggle" data-value="'+SharingType.WORLD+'"><span class="glyphicon glyphicon-globe"></span> Allow everybody to use collection</a>');break;case SharingType.WORLD:this.$(".is-private").hide(),this.$(".is-public").show(),f=__("This collection is public."),l='<p class="micro">'+__("Everybody can currently add this data to their own maps.")+"</p>"+__('<a href="#" class="btn btn-danger btn-sm sharing-toggle make-private" data-value="'+SharingType.PRIVATE+'""><span class="glyphicon glyphicon-lock"></span> Make this collection private</a>')}this.$(".sharing-status").popover("destroy"),this.$(".sharing-status").attr("disabled",!1),this.$(".sharing-status").popover({animation:!1,content:l,html:l,title:f,container:n.superView.$el,placement:"bottom"}).on("show.bs.popover",function(e){n.hidePopovers()}).on("shown.bs.popover",function(t){e(".sharing-toggle").click(function(e){return n.sharingToggleClicked(e)}),t.stopPropagation()})}},toggleLayerClicked:function(e){return this.model.parentMap?(this.model.toggleEnabled(!this.model.isEnabled()),!1):(this.isExpanded()?this.collapse():this.expand(),!1)},showLayerEditorClicked:function(e){return this.model.trigger("showMapLayerEditor"),!1},showLayerGraphsClicked:function(e){return this.model.trigger("showMapLayerGraphs"),!1},showLayerExtentsClicked:function(e){return app.mapView.zoomToExtent(this.model.attributes.featureCollection.bbox),!1},showLayerDetailsClicked:function(e){var t=this;return this.$(".details").uiToggle({activate:this.$(".show-layer-details"),show:function(){t.expand()}}),!1},editCollectionClicked:function(e){this.toggleInPlaceEditMode()},histogramClicked:function(e){this.model.parentMap&&app.showMapLayerGraphs(this.model).toggleGraphView("histogram")}});return t.extend(v.prototype,l),t.extend(v.prototype,c),t.extend(v.prototype,h),v});