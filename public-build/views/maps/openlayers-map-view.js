require.config({paths:{openlayers:"lib/openlayers/OpenLayers-2.13.1/OpenLayers",openlayers_stamen:"lib/openlayers/stamen"},shim:{openlayers:{exports:"OpenLayers"},openlayers_stamen:{deps:["openlayers"]}}}),define(["jquery","underscore","backbone","config","utils","text!templates/map.html","views/maps/map-view-base","views/maps/feature-layer-base","views/data-detail-view","openlayers","openlayers_stamen"],function(e,t,n,r,i,s,o,u,a,f){var l=f.Geometry,c=u.extend({initialize:function(){c.__super__.initialize.apply(this,arguments);var e=this.model.getLayerOptions();this.layer=new f.Layer.Vector(this.model.id,{renderers:[e.htmlRenderer&&e.htmlRenderer!=""?e.htmlRenderer:"SVG","SVG","VML","Canvas"],wrapDateLine:!0,rendererOptions:{}})},addTo:function(e){this.map=e,this.map.addLayers([this.layer])},draw:function(){this.layer.redraw()},toggle:function(e){this.layer.setVisibility(e)},destroyFeatures:function(){this.trigger("destroy:features"),this.layer.destroyFeatures()},destroy:function(){this.destroyFeatures(),this.map.removeLayer(this.layer)},featureReset:function(e,n){console.log("featureReset");var r=this;this.destroyFeatures(),this.layer.addFeatures(t.map(e.models,function(t){return r.modelToFeature(t,e)}))},featureAdd:function(e,t,n){this.layer.addFeature([this.modelToFeature(e,t)])},modelToFeature:function(e,t){var n=e.getRenderAttr(),r=t.mapLayer.attributes.layerOptions,i;switch(r.featureType){case FeatureType.POINTS:case FeatureType.BUBBLES:i=this.formats.geoJSON.parseGeometry({type:"Point",coordinates:e.getCenter()});break;case FeatureType.SQUARE_TILES:if(!r.featureTypeFallback||t.gridSize()){i=this.formats.geoJSON.parseGeometry({type:"Polygon",coordinates:[e.getBox()]});break};case FeatureType.SHAPES:i=this.formats.geoJSON.parseGeometry(e.attributes.geometry)}return new f.Feature.Vector(i,n)},initStyleMap:function(){var e=this,n=this.model,r=n.getLayerOptions(),i=function(e,t){return(e||e==0)&&e!=""&&(typeof e=="string"||e>=0)?e:t},s=r.opacity,o=i(r.featureSize,MAX_BUBBLE_SIZE),u=Math.min(o,i(r.minFeatureSize,MIN_BUBBLE_SIZE)),a={getColor:function(e){return e.attributes.color},getStrokeColor:function(e){var t=e.attributes.model;return t.getRenderAttr("strokeColor",function(){return strokeForColor(t.getRenderAttr("color"))})},getBubbleRadius:function(e){return isNaN(e.attributes.size)?u*.5:(u+e.attributes.size*(o-u))*.5}},l={pointRadius:i(r.featureSize*.5,DEFAULT_POINT_RADIUS),fillColor:"${getColor}",fillOpacity:s,strokeDashstyle:r.strokeDashstyle,strokeLinecap:r.strokeLinecap,graphicZIndex:0,graphicName:null};switch(r.featureType){case FeatureType.GRAPHIC:l=t.extend(l,{externalGraphic:r.externalGraphic,graphicWidth:r.graphicWidth,graphicHeight:r.graphicHeight});default:case FeatureType.POINTS:l=t.extend(l,{strokeColor:i(r.strokeColor,"${getStrokeColor}"),strokeWidth:i(r.strokeWidth,DEFAULT_FEATURE_STROKE_WIDTH),strokeOpacity:i(r.strokeOpacity,s*.8)});break;case FeatureType.SQUARE_TILES:l=t.extend(l,{strokeColor:i(r.strokeColor,"${getStrokeColor}"),strokeWidth:i(r.strokeWidth,DEFAULT_FEATURE_STROKE_WIDTH),strokeOpacity:i(r.strokeOpacity,s*.8)});break;case FeatureType.SHAPES:l=t.extend(l,{strokeColor:i(r.strokeColor,"${getColor}"),strokeWidth:i(r.strokeWidth,DEFAULT_FEATURE_STROKE_WIDTH),strokeOpacity:i(r.strokeOpacity,s)});break;case FeatureType.BUBBLES:l=t.extend(l,{pointRadius:"${getBubbleRadius}",strokeColor:i(r.strokeColor,"${getStrokeColor}"),strokeWidth:i(r.strokeWidth,DEFAULT_FEATURE_STROKE_WIDTH),strokeOpacity:i(r.strokeOpacity,s*.5)})}var c={fillOpacity:l.fillOpacity==1?.8:Math.min(1,l.fillOpacity*1.5),strokeOpacity:l.strokeOpacity==1?.1:Math.min(1,l.strokeOpacity*1.5),graphicZIndex:100};this.layer.styleMap=new f.StyleMap({"default":new f.Style(l,{context:a}),select:new f.Style(c,{context:a})})}}),h=o.extend({tagName:"div",className:"map-view",initialize:function(e){h.__super__.initialize.call(this,e),this.template=t.template(s),this.on("update:style",this.updateViewStyle),this.on("update:base",this.updateViewBase),this.externalProjection=new f.Projection("EPSG:4326"),this.internalProjection=null,f.ImgPath=BASE_URL+"/assets/openlayers-light/"},getVisibleMapArea:function(){var e=this.map,t=e.getZoom(),n=e.getExtent(),r=e.getCenter(),i=new f.Geometry.Point(n.left,n.bottom),s=new f.Geometry.Point(n.right,n.top);i.transform(this.internalProjection,this.externalProjection),s.transform(this.internalProjection,this.externalProjection);var o=[[i.x,i.y],[s.x,s.y]];return r.transform(this.internalProjection,this.externalProjection),r=[r.lon,r.lat],{center:r,zoom:t,bounds:o}},render:function(t,n){return e(this.el).html(this.template()),this},renderMap:function(e,t){var n=this;this.map=new f.Map({div:"map",displayProjection:this.externalProjection,scope:this,controls:[],eventListeners:{moveend:function(e){if(n.map.suppressMoveEnd){n.map.suppressMoveEnd=!1;return}n.visibleAreaChanged(n.getVisibleMapArea())}},theme:BASE_URL+"lib/openlayers/OpenLayers-2.13.1/theme/default/style.css"}),this.map.addControls([new f.Control.Zoom,new f.Control.Navigation]),this.updateViewBase(e,t);var r=new f.Control.ScaleLine;return this.map.addControl(r),this.map.addControl(new f.Control.Attribution),DEBUG&&this.map.addControl(new f.Control.MousePosition),this.internalProjection=this.map.baseLayer.projection,this.formats={geoJSON:new f.Format.GeoJSON({internalProjection:this.internalProjection,externalProjection:this.externalProjection,ignoreExtraDims:!0})},h.__super__.renderMap.call(this,e,t),this},initSelectControl:function(){var e=this,t=[];this.map.layers.forEach(function(e,n){e.baselayer||t.push(e)}),this.selectControl&&this.map.removeControl(this.selectControl),this.selectControl=new f.Control.SelectFeature(t,{clickout:!0,multiple:!1,hover:!1,box:!1,onBeforeSelect:function(e){},onSelect:function(t){e.featureSelected(t)},onUnselect:function(t){e.featureUnselected(t)}}),this.map.addControl(this.selectControl),this.selectControl.activate(),this.selectControl.handlers.feature.stopDown=!1},layerChanged:function(e,t){var n=this.getFeatureLayer(e);if(e.hasChanged("layerOptions.htmlRenderer")){console.log("Creating layer with new renderer"),n.destroy(),this.featureLayers[e.id]=this.initFeatureLayer(e),n.featureReset(e.mapFeatures);return}n.initStyleMap(),e.hasChangedColors()||e.hasChanged("layerOptions.featureType")||e.hasChanged("layerOptions.featureTypeFallback")||e.hasChanged("layerOptions.attrMap.numeric")||e.hasChanged("layerOptions.attrMap.featureSize")||e.hasChanged("layerOptions.attrMap.featureColor")?n.featureReset(e.mapFeatures):n.draw()},drawLayer:function(e){this._addFeatures[e.id]&&this._addFeatures[e.id].length&&(this.featureLayers[e.id].addFeatures(this._addFeatures[e.id]),delete this._addFeatures[e.id])},initFeatureLayer:function(e){var n=this,r=new c({model:e,collection:e.mapFeatures});return r.initStyleMap(),r.addTo(this.map),r.formats=this.formats,r.on("destroy:features",function(){t.each(r.layer.features,function(e){n.destroyPopupForFeature(e)})}),this.initSelectControl(),r},featureSelected:function(e){this.trigger("feature:selected",e.attributes.model.collection.mapLayer,e.attributes.model,e)},featureUnselected:function(e){this.trigger("feature:unselected",e.attributes.model.collection.mapLayer,e.attributes.model,e)},setPopupForFeature:function(t,n){this.destroyPopupForFeature(t);var r=new f.Popup("popup",t.geometry.getBounds().getCenterLonLat(),null,"",null,!1);t.popup=r,this.map.addPopup(r),e(r.div).css({overflow:"visible",background:"blue",height:0,width:0}),e(r.div).append(n),e(n).css({top:"auto",left:"-"+e(n).outerWidth()/2+"px",right:"auto",bottom:25})},destroyPopupForFeature:function(e){e.popup&&(this.map.removePopup(e.popup),e.popup.destroy(),e.popup=null,this.selectControl.unselect(e))},updateViewBase:function(e,t){if(!e||!this.ViewBase[e])e=DEFAULT_MAP_VIEW_BASE;if(e==this.viewBase)return;this.baselayer&&this.map.removeLayer(this.baselayer.mapLayer),this.baselayer=new this.ViewBase[e](this.map,this,t||this.viewStyle),this.viewBase=e,this.viewStyles=this.baselayer.mapStyles,this.viewStyle=this.baselayer.mapStyle,this.defaultViewStyle=this.baselayer.defaultMapStyle,this.map.addLayer(this.baselayer.mapLayer),this.trigger("view:optionschanged",this)},updateViewStyle:function(e){this.baselayer.setMapStyle&&this.baselayer.setMapStyle(e)&&(this.viewStyle=this.baselayer.mapStyle,this.trigger("view:optionschanged",this))},updateViewOptions:function(e){e.baselayerOpacity!=undefined&&this.baselayer.mapLayer.setOpacity(e.baselayerOpacity),e.backgroundColor!=undefined&&this.$el.css("background-color",e.backgroundColor)},setVisibleMapArea:function(e){var t=new f.LonLat(e.center[0],e.center[1]);t.transform(this.externalProjection,this.internalProjection),this.map.setCenter(t,e.zoom)},zoomToExtent:function(e){var t=new f.Bounds(e[0],e[1],e[2],e[3]);t.transform(this.externalProjection,this.internalProjection),this.map.zoomToExtent(t,!this.map.isValidZoomLevel(this.map.getZoomForExtent(t)))}}),p=h.prototype.Baselayer=f.Class({initialize:function(e,t,n){this.map=e,this.mapView=t,this.setMapStyle(n),this.initMapLayer()},initMapLayer:function(e){},setMapStyle:function(e){var t=this.mapStyle;return this.mapStyles&&this.mapStyles[e]?this.mapStyle=e:this.mapStyle=this.defaultMapStyle,t!=this.mapStyle?(this.mapLayer&&this.applyMapStyle(),!0):!1},applyMapStyle:function(){return this.mapLayer&&(this.map.removeLayer(this.mapLayer),this.map.suppressMoveEnd=!0,this.initMapLayer(!0),this.map.addLayer(this.mapLayer)),!0},mapStyles:null,defaultMapStyle:DEFAULT_MAP_STYLE,mapStyle:null}),d=h.prototype.ViewBase={};return d.gm=f.Class(p,{providerName:"Google Maps",initMapLayer:function(e){var t=this,n=this.mapLayer=new f.Layer.Google("Google Maps",{type:"styled",wrapDateLine:!0,sphericalMercator:!0,baselayer:!0,numZoomLevels:MAP_NUM_ZOOM_LEVELS});e||this.map.events.on({addlayer:function(e){e.layer.baselayer&&e.layer==n&&(t.applyMapStyle(),google.maps.event.addListenerOnce(e.layer.mapObject,"idle",function(){t.mapView.trigger("view:ready")}))}})},applyMapStyle:function(){var e="simplified";switch(this.mapStyle){case"dark":var t=[{stylers:[{saturation:-100},{visibility:e},{lightness:45},{invert_lightness:!0},{gamma:1.1}]},{elementType:"labels",stylers:[{visibility:"off"}]}];break;case"light":var t=[{stylers:[{saturation:-100},{visibility:e},{lightness:8},{gamma:1.31}]},{elementType:"labels",stylers:[{visibility:"off"}]}];break;case"full":var t=[{stylers:[]}]}var n=t,r={name:"Styled Map"},i=new google.maps.StyledMapType(n,r);this.mapLayer.mapObject.mapTypes.set("styled",i),this.mapLayer.mapObject.setMapTypeId("styled")},mapStyles:{dark:"Dark",light:"Light",full:"Full"}}),d.osm=f.Class(p,{providerName:"OpenStreetMap",initMapLayer:function(e,t){var n=this;this.mapLayer=this.mapLayer=new f.Layer.OSM(null,t,{baselayer:!0,numZoomLevels:MAP_NUM_ZOOM_LEVELS,eventListeners:{loadend:function(){e||n.mapView.trigger("view:ready")}}})},defaultMapStyle:null}),d.stm=f.Class(p,{providerName:"Stamen",initMapLayer:function(e){var t=this;this.mapLayer=this.mapLayer=new f.Layer.Stamen(this.styleIds[this.mapStyle],{baselayer:!0,numZoomLevels:MAP_NUM_ZOOM_LEVELS,eventListeners:{loadend:function(){e||t.mapView.trigger("view:ready")}}})},mapStyles:{dark:"Toner",light:"Toner Lite",watercolor:"Watercolor"},styleIds:{dark:"toner",light:"toner-lite",watercolor:"watercolor"}}),d.blank=f.Class(p,{providerName:"Blank",initMapLayer:function(e){d.osm.prototype.initMapLayer.call(this,!1,BASE_URL+"/assets/blank.gif"),this.mapLayer.attribution=""},mapStyles:{dark:"Dark",light:"Light"}}),h});