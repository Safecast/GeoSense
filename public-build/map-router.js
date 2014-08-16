define(["jquery","underscore","backbone","config","utils","permissions","views/login-signup-view","views/header-view","views/setup-view","views/help-panel-view","views/layers-panel-view","views/data-detail-view","views/map-info-view","views/baselayer-editor-view","views/map-layer-editor-view","views/map-layer-view","views/data-library-panel-view","views/data-import-view","views/modal-view","views/share-view","views/graphs-panel-view","views/graphs/timeline-scatter-plot-view","views/graphs/histogram-view","views/notification-bubble-view","models/map","models/map-layer","text!templates/help/about.html"],function(e,t,n,r,i,s,o,u,a,f,l,c,h,p,d,v,m,g,y,b,w,E,S,x,T,N,C){var k=n.Router.extend({routes:{},defaultRoutes:{"admin/:slug":"mapAdminRoute","admin/:slug/:view":"mapAdminRoute","admin/:slug/:view/:pos":"mapAdminRoute",":slug":"mapRoute",":slug/:view":"mapRoute",":slug/:view/:pos":"mapRoute","s/:slug":"mapRoute","s/:slug/:view":"mapRoute","s/:slug/:view/:pos":"mapRoute"},byHostRoutes:{admin:"mapAdminRouteByHost","admin/:view":"mapAdminRouteByHost","admin/:view/:pos":"mapAdminRouteByHost","":"mapRouteByHost",":view":"mapRouteByHost",":view/:pos":"mapRouteByHost"},getRoutes:function(e){var t;e?(console.log("route by custom host"),t=this.byHostRoutes):(console.log("route by slug"),t=this.defaultRoutes);var n=[];for(var r in t)n.unshift([r,t[r]]);return n},initialize:function(e,n){var r=this;t.each(this.getRoutes(n),function(e){r.route.apply(r,e)}),e&&(this.map=new T(e),this.map.isCustomHost=n),this.isRendered=!1,this.mapLayerSubViewsAttached=!1,this.mapLayerEditorViews={},this.graphsPanelViews={},this.mapChanged=!1,this.adminRoute=!1,this.routingByHost=!1,this.sessionOptions={},this.isEmbedded=window!=window.top},mapRoute:function(t,n,r){var i,s,o,u,a,f,l;if(n){this.setupRoute=n=="setup";if(!this.setupRoute){var c=n.split(":");i=c.shift(),c.length>1&&(s=c.shift()),c.length&&(o=c.shift())}else e("#app").empty()}if(r!=undefined){var c=r.split(",");c.length==3&&(a=c.pop()),c.length==2&&(f=parseFloat(c.shift()),l=parseFloat(c.shift()),!isNaN(f)&&!isNaN(l)&&(u=[f,l]))}this.render();if(!this.mapView){console.log("slug:",t,"mapViewName:",i,"viewBase:",s,"viewStyle:",o,"center:",u,"zoom:",a);if(!this.map){this.map=new T({slug:t}),this.loadAndInitMap(t,i,u,a,s,o);return}this.initMap(i,u,a,s,o)}else{var h=this.getDefaultVisibleMapArea();u&&(h.center=u),a&&(h.zoom=a),this.mapView.setVisibleMapArea(h)}},mapAdminRoute:function(e,t,n){this.adminRoute=!0,this.mapRoute(e,t,n)},mapRouteByHost:function(e,t){return this.routingByHost=!0,this.mapRoute(null,e,t)},mapAdminRouteByHost:function(e,t){return this.routingByHost=!0,this.mapAdminRoute(null,e,t)},setUIReady:function(){e("#center-spinner").hide("fast",function(){e(this).remove()})},loadAndInitMap:function(e,t,n,r,i,s){var o=this;this.map.fetch({success:function(e,t,n){o.initMap()},error:function(t,n,r){console.error("failed to load map",e)}})},initMap:function(e,n,r,i,s){var o=this;this.mapLayersById={},t.each(this.map.attributes.layers,function(e){o.initMapLayer(o.map.newLayerInstance(e))});var u=o.map.attributes.viewOptions||{};o.setViewOptions(u);var a=function(e,t){return e&&e!=""?e:t};o.initMapView(a(e,u.viewName),n,r,a(i,u.viewBase),a(s,u.viewStyle))},initMapView:function(t,n,i,s,o){var u=this,a;this.mapViewName=t,this.mapView&&(this.mapView.remove(),this.stopListening(this.mapView),delete this.mapView);switch(this.mapViewName){default:case"map":a=r.MAP_VIEW_MODULES[0],this.mapViewName="map"}e(".map-view-toggle").each(function(){e(this).toggleClass("active",e(this).hasClass(u.mapViewName))});var f=this.getDefaultVisibleMapArea();n&&(f.center=n),i&&(f.zoom=i),require([a],function(e){u.mapView=new e,u.listenTo(u.mapView,"view:areachanged",u.visibleMapAreaChanged),u.listenTo(u.mapView,"view:ready",u.mapViewReady),u.listenTo(u.mapView,"view:optionschanged",u.viewOptionsChanged);var t=u.mapView.render().el;u.$mainEl.append(t),u.mapView.renderMap(s,o),u.mapView.setVisibleMapArea(f)})},mapViewReady:function(){this.__mapViewReady,this.__mapViewReady=!0;var e=this;setTimeout(function(){console.log("mapViewReady: attaching sub views for all layers"),e.setUIReady(),e.attachMapLayerSubViews(),e.fetchMapFeatures()},200)},isMapAdmin:function(){return this.adminRoute&&this.map.attributes.admin},getMapLayer:function(e){return this.mapLayersById[e]},initMapLayer:function(e,t){var n=this;return this.mapLayersById[e.id]=e,e.initCollections(),this.mapLayerSubViewsAttached&&(this.attachSubViewsForMapLayer(e,t),this.fetchMapFeatures()),this.listenTo(e,"toggle:enabled",function(){e.isEnabled()?setTimeout(function(){n.fetchMapFeatures()},300):n.hideMapLayerGraphs(e)}),this.listenTo(e,"show:editor",function(){this.showMapLayerEditor(e)}),this.listenTo(e,"show:graphs",function(){this.showMapLayerGraphs(e)}),this.listenTo(e,"destroy",function(){n.stopListening(e),delete n.mapLayersById[e.id]}),e.getDataStatus()!=DataStatus.COMPLETE&&this.pollForMapLayerStatus(e,INITIAL_POLL_INTERVAL),e},pollForMapLayerStatus:function(e,t){var n=this;if(t){setTimeout(function(){n.pollForMapLayerStatus(e)},t);return}e.once("sync",function(){e.canDisplayValues()&&n.fetchMapFeatures();if(e.getDataStatus()==DataStatus.COMPLETE){e.trigger("change",e,{complete:!0}),n.trigger("featureCollection:added");return}n.pollForMapLayerStatus(e,POLL_INTERVAL)}),e.fetch({data:{incomplete:!0},poll:!0})},attachSubViewsForMapLayer:function(e,t){this.layersPanelView.isAttached||this.attachPanelView(this.layersPanelView).hide().show(),console.log("attachSubViewsForMapLayer",e.id,e.getDisplay("title"));var n=(new v({model:e})).render();this.layersPanelView.appendSubView(n),t&&n.hide().show("fast"),this.mapView.attachLayer(e),e.limitFeatures()&&e.mapFeatures.setVisibleMapArea(this.mapView.getVisibleMapArea()),this.listenTo(e,"feature:selected",this.featureSelected),this.listenTo(e,"feature:unselected",this.featureUnselected);if(e.hasGraphs()){var r=(new w({model:e,collection:e.mapFeatures})).render();e.timeline&&r.addGraphView("timeline",(new E({model:e,collection:e.timeline})).render(),__("Timeline")),e.histogram&&r.addGraphView("histogram",(new S({model:e,collection:e.histogram})).render(),__("Histogram")),this.graphsPanelViews[e.id]=r;var i=function(){setTimeout(function(){e.fetchGraphs()},500)};e.isEnabled()?i():e.once("toggle:enabled",function(){i()})}},attachMapLayerSubViews:function(){var e=this;e.mapLayerSubViewsAttached||(e.mapLayerSubViewsAttached=!0,t.each(e.mapLayersById,function(t){e.attachSubViewsForMapLayer(t)}),this.layersPanelView.show("fast"))},fetchMapFeatures:function(){t.each(this.mapLayersById,function(e){e.isEnabled()&&e.canDisplayValues()&&e.mapFeatures.canFetch()&&!e.mapFeatures.isCurrent()&&(console.log("Fetching features for",e.id,e.getDisplay("title")),e.mapFeatures.fetch())})},adjustViewport:function(){this.$mainEl.css("top",e("header").outerHeight()+"px")},render:function(){var t=this;window.document.title=this.map.get("title")+" – GeoSense",this.isEmbedded&&e("body").addClass("embed"),this.headerView=new u({model:this.map}),this.mapWasCreatedAnonymously=!this.map.createdBy,this.on("user:login",function(){t.mapWasCreatedAnonymously&&(t.map.attributes.createdBy=s.currentUser(),console.log("Setting map user",t.map.attributes.createdBy)),t.headerView.updateUser()}),e("#app").append(this.headerView.render().el),this.$mainEl=e('<div id="main-viewport"></div>'),this.mainEl=this.$mainEl[0],e("#app").append(this.mainEl),e(window).on("resize",function(){t.adjustViewport()}),setTimeout(function(){t.adjustViewport()},0),this.isMapAdmin()&&(this.setupView=(new a({model:this.map})).render(),this.setupView.on("map:saved",function(e){x.success(__("Map information saved."))}),this.setupRoute&&this.showSetupView()),this.layersPanelView=(new l({})).render(),this.baselayerEditorView=(new p({model:this.map})).render();var n=e('<div class="snap top" /><div class="snap right" />');t.$mainEl.append(n),this.isMapAdmin()&&(this.helpPanelView=(new f).render(),(!this.map.attributes.layers.length||!s.currentUser())&&this.attachPanelView(this.helpPanelView).hide().show("fast")),t.isRendered=!0},geocode:function(e,t){var n=this,r=new google.maps.Geocoder;r.geocode({address:e},t)},zoomToAddress:function(t){var n=this;this.geocode(t,function(r,i){if(i!=google.maps.GeocoderStatus.OK){alert("Unable to find address: "+t);return}var s=r[0].geometry.viewport,o=s.getSouthWest(),u=s.getNorthEast();n.mapView.zoomToExtent([o.lng(),o.lat(),u.lng(),u.lat()]),e(".search-query").blur()})},genMapViewParam:function(e){if(!e||e=="map"){var t=this.mapView.viewBase&&this.mapView.viewBase!=DEFAULT_MAP_VIEW_BASE,n=t||this.mapView.viewStyle&&this.mapView.viewStyle!=this.mapView.defaultViewStyle;e=this.mapViewName+(n||t?":":"")+(t?this.mapView.viewBase+":":"")+(n?this.mapView.viewStyle?this.mapView.viewStyle:"default":"")}return e},getCurrentViewOptions:function(){var t=e.extend(this.sessionOptions.viewOptions,{viewName:this.mapViewName,viewBase:this.mapView.viewBase,viewStyle:this.mapView.viewStyle});return t},currentMapUriOptions:function(e){var t={x:e.center[0],y:e.center[1],zoom:e.zoom,view:this.genMapViewParam("map")},n={x:this.map.attributes.initialArea.center.length?this.map.attributes.initialArea.center[0]:0,y:this.map.attributes.initialArea.center.length?this.map.attributes.initialArea.center[1]:0,zoom:this.map.attributes.initialArea.zoom!=undefined?this.map.attributes.initialArea.zoom:0};return n.x!=t.x||n.y!=t.y||n.zoom!=t.zoom?t:{mapViewName:t.view}},currentMapUri:function(){var e=this.currentMapUriOptions(this.mapView.getVisibleMapArea());return this.isMapAdmin()?this.map.adminUri(e):this.map.publicUri(e)},currentPublicMapUrl:function(){var e=this.currentMapUriOptions(this.mapView.getVisibleMapArea());return this.map.publicUrl(e)},resetMap:function(){var e=this.isMapAdmin()?this.map.adminUri():this.map.publicUri();this.mapChanged=!1,this.navigate(e,{trigger:!0})},visibleMapAreaChanged:function(e,n){this.mapChanged&&this.navigate(this.currentMapUri(),{trigger:!1}),this.mapChanged=!0,t.each(this.mapLayersById,function(e){e.limitFeatures()&&e.mapFeatures.setVisibleMapArea(n)}),this.fetchMapFeatures()},getDefaultVisibleMapArea:function(){var e=DEFAULT_MAP_AREA;return this.map.attributes.initialArea&&this.map.attributes.initialArea.center.length&&(e.center=this.map.attributes.initialArea.center),this.map.attributes.initialArea.zoom!=undefined&&(e.zoom=this.map.attributes.initialArea.zoom),e},viewOptionsChanged:function(t){var n=this;if(t==this.mapView){n.setViewOptions(),e("#app").removeClass(function(e,t){return(t.match(/\bmap-style-\S+/g)||[]).join(" ")});var r={},i=this.mapView.viewStyle||"default";this.mapView.viewStyles?r=this.mapView.viewStyles:r={"default":"Default"},e("#app").addClass("map-style-"+i);var s=[];e.each(r,function(e,t){var n=e;s.push('<li class="view-style'+(n==i?" active":"")+'">'+'<a href="#'+n+'">'+t+"</a></li>")}),e("#viewStyle .dropdown-menu .view-style").remove(),e("#viewStyle .dropdown-menu").prepend(s.join("")),e("#viewStyleCurrent").text(r[i]),e("#viewStyle").show();if(this.mapView.viewBase){var s=[];for(var o in this.mapView.ViewBase){var u=this.mapView.ViewBase[o].prototype;s.push('<li class="view-base'+(o==n.mapView.viewBase?" active":"")+'">'+'<a href="#'+o+'">'+'<span class="view-base-thumb"'+(o!="blank"?' style="background: url('+BASE_URL+"/assets/baselayer-thumbs/"+o+'.png)"':"")+"></span>"+'<span class="view-base-caption">'+u.providerName+"</span>"+"</a></li>")}e("#viewBase .dropdown-menu .view-base").remove(),e("#viewBase .dropdown-menu").prepend(s.join("")),e("#viewBaseCurrent").text(this.mapView.ViewBase[this.mapView.viewBase].prototype.providerName),e("#viewBaselayer").show()}else e("#viewBaselayer").hide();this.baselayerEditorView.$(".form-group.opacity").toggle(this.mapView.viewBase!="blank")}},setViewStyle:function(e,t){this.mapView.trigger("update:style",e),(t||t==undefined)&&this.navigate(this.currentMapUri(),{trigger:!1}),this.setViewOptions()},setViewBase:function(e,t){this.mapView.trigger("update:base",e),(t||t==undefined)&&this.navigate(this.currentMapUri(),{trigger:!1}),this.setViewOptions()},setViewOptions:function(t){t?this.sessionOptions.viewOptions=e.extend(this.sessionOptions.viewOptions,t):t=this.sessionOptions.viewOptions,this.mapView&&(this.__mapViewReady=!1,this.mapView.updateViewOptions(t))},featureSelected:function(e,t,n){var r=this;if(!SHOW_DETAIL_DATA_ON_MAP)this.dataDetailView||(this.dataDetailView=(new c).render()),this.dataDetailView.isAttached||(this.attachPanelView(this.dataDetailView),this.dataDetailView.snapToView(this.layersPanelView,"left",!0).hide().show("fast")),this.dataDetailView.setPanelState(!0),this.dataDetailView.setModel(t),this.dataDetailView.show();else{var i=new c;i.render(),i.setModel(t),i.on("panel:close",function(){r.mapView.destroyPopupForFeature(n)});var s=i.el;this.mapView.setPopupForFeature(n,s)}},featureUnselected:function(e,t,n){this.dataDetailView&&this.dataDetailView.hide(),this.mapView.destroyPopupForFeature(n)},showMapInfo:function(){this.mapInfoView=(new h({model:this.map})).render(),this.mapInfoView.show()},toggleDataLibrary:function(){var e=this;this.dataLibraryView||(this.dataLibraryView=(new m).render()),this.dataLibraryView.isVisible()?this.dataLibraryView.close("fast"):(this.attachPanelView(this.dataLibraryView),this.dataLibraryView.show("fast"))},showShareLink:function(){var e=(new b).render();e.show()},showAbout:function(){var e=(new y).render();e.setTitle("About GeoSense"),e.setBody(C),e.show()},showSignup:function(){(new o).showSignup()},showLogin:function(){(new o).showLogin()},showSetupView:function(e){this.setupView.show(),e&&this.setupView.focusTab(e)},toggleDataImport:function(){if(!s.currentUser()){this.showSignup();return}this.dataImportView||(this.dataImportView=(new g({})).render()),this.dataImportView.show()},showBaselayerEditor:function(){this.attachPanelView(this.baselayerEditorView).snapToView(this.layersPanelView,"left",!0).hide().show("fast")},hideMapLayerGraphs:function(e){return this.graphsPanelViews[e.id]&&this.graphsPanelViews[e.id].hide("fast"),this.graphsPanelViews[e.id]},showMapLayerGraphs:function(e){var n=this,r=e.id;return t.each(this.graphsPanelViews,function(e,t){r==t?(e.isAttached||n.attachPanelView(e).hide(),e.expand().show("fast")):setTimeout(function(){e.hide("fast")},250)}),this.graphsPanelViews[e.id]},showMapLayerEditor:function(e){var t=e.id,n=this;this.mapLayerEditorViews[t]||(this.mapLayerEditorViews[t]=(new d({model:this.getMapLayer(t)})).render(),this.mapLayerEditorViews[t].on("mapLayer:saved",function(){x.success(__("Layer saved."))}),this.mapLayerEditorViews[t].on("mapLayer:destroyed",function(){x.success(__("Layer removed."))}));for(var r in this.mapLayerEditorViews)t!=this.mapLayerEditorViews[r].model.get("_id")?this.mapLayerEditorViews[r].detach():this.mapLayerEditorViews[r].isVisible()?this.mapLayerEditorViews[r].close("fast"):(this.mapLayerEditorViews[r].hide(),this.attachPanelView(this.mapLayerEditorViews[r]),this.mapLayerEditorViews[r].snapToView(this.layersPanelView,"left",!0).show("fast"));return this.mapLayerEditorViews[t]},attachPanelView:function(e){return e.attachTo(this.mainEl),e},saveNewMapLayer:function(e){var t=this,n=this.map.newLayerInstance({featureCollection:{_id:e}});console.log("saving new map layer",n),n.once("sync",function(){t.initMapLayer(n,!0),t.trigger("mapLayer:added",n)}),n.save({},{success:function(e,n,r){console.log("new map layer saved",e),t.layersPanelView.show("fast"),x.success(__("Layer added to map."))},error:function(e,t,n){console.error("failed to save new map layer")}})}}),L=function(e,t){return i.initAjaxErrorNotification(),new k(e,t)},A=function(){if(!n.history.start({pushState:!0,root:BASE_URL.replace(/^(.*:\/\/)?[^\/]*\/?/,""),silent:!1})){var e=window.location.href.length-1;window.location.href[e]=="/"?window.location.href=window.location.href.substr(0,e):window.location.href=BASE_URL+"404"}};return{initialize:L,start:A}});