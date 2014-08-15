/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Map=OpenLayers.Class({Z_INDEX_BASE:{BaseLayer:100,Overlay:325,Feature:725,Popup:750,Control:1e3},id:null,fractionalZoom:!1,events:null,allOverlays:!1,div:null,dragging:!1,size:null,viewPortDiv:null,layerContainerOrigin:null,layerContainerDiv:null,layers:null,controls:null,popups:null,baseLayer:null,center:null,resolution:null,zoom:0,panRatio:1.5,options:null,tileSize:null,projection:"EPSG:4326",units:null,resolutions:null,maxResolution:null,minResolution:null,maxScale:null,minScale:null,maxExtent:null,minExtent:null,restrictedExtent:null,numZoomLevels:16,theme:null,displayProjection:null,fallThrough:!1,autoUpdateSize:!0,eventListeners:null,panTween:null,panMethod:OpenLayers.Easing.Expo.easeOut,panDuration:50,zoomTween:null,zoomMethod:OpenLayers.Easing.Quad.easeOut,zoomDuration:20,paddingForPopups:null,layerContainerOriginPx:null,minPx:null,maxPx:null,initialize:function(e,t){arguments.length===1&&typeof e=="object"&&(t=e,e=t&&t.div),this.tileSize=new OpenLayers.Size(OpenLayers.Map.TILE_WIDTH,OpenLayers.Map.TILE_HEIGHT),this.paddingForPopups=new OpenLayers.Bounds(15,15,15,15),this.theme=OpenLayers._getScriptLocation()+"theme/default/style.css",this.options=OpenLayers.Util.extend({},t),OpenLayers.Util.extend(this,t);var n=this.projection instanceof OpenLayers.Projection?this.projection.projCode:this.projection;OpenLayers.Util.applyDefaults(this,OpenLayers.Projection.defaults[n]),this.maxExtent&&!(this.maxExtent instanceof OpenLayers.Bounds)&&(this.maxExtent=new OpenLayers.Bounds(this.maxExtent)),this.minExtent&&!(this.minExtent instanceof OpenLayers.Bounds)&&(this.minExtent=new OpenLayers.Bounds(this.minExtent)),this.restrictedExtent&&!(this.restrictedExtent instanceof OpenLayers.Bounds)&&(this.restrictedExtent=new OpenLayers.Bounds(this.restrictedExtent)),this.center&&!(this.center instanceof OpenLayers.LonLat)&&(this.center=new OpenLayers.LonLat(this.center)),this.layers=[],this.id=OpenLayers.Util.createUniqueID("OpenLayers.Map_"),this.div=OpenLayers.Util.getElement(e),this.div||(this.div=document.createElement("div"),this.div.style.height="1px",this.div.style.width="1px"),OpenLayers.Element.addClass(this.div,"olMap");var r=this.id+"_OpenLayers_ViewPort";this.viewPortDiv=OpenLayers.Util.createDiv(r,null,null,null,"relative",null,"hidden"),this.viewPortDiv.style.width="100%",this.viewPortDiv.style.height="100%",this.viewPortDiv.className="olMapViewport",this.div.appendChild(this.viewPortDiv),this.events=new OpenLayers.Events(this,this.viewPortDiv,null,this.fallThrough,{includeXY:!0}),OpenLayers.TileManager&&this.tileManager!==null&&(this.tileManager instanceof OpenLayers.TileManager||(this.tileManager=new OpenLayers.TileManager(this.tileManager)),this.tileManager.addMap(this)),r=this.id+"_OpenLayers_Container",this.layerContainerDiv=OpenLayers.Util.createDiv(r),this.layerContainerDiv.style.zIndex=this.Z_INDEX_BASE.Popup-1,this.layerContainerOriginPx={x:0,y:0},this.applyTransform(),this.viewPortDiv.appendChild(this.layerContainerDiv),this.updateSize(),this.eventListeners instanceof Object&&this.events.on(this.eventListeners),this.autoUpdateSize===!0&&(this.updateSizeDestroy=OpenLayers.Function.bind(this.updateSize,this),OpenLayers.Event.observe(window,"resize",this.updateSizeDestroy));if(this.theme){var i=!0,s=document.getElementsByTagName("link");for(var o=0,u=s.length;o<u;++o)if(OpenLayers.Util.isEquivalentUrl(s.item(o).href,this.theme)){i=!1;break}if(i){var a=document.createElement("link");a.setAttribute("rel","stylesheet"),a.setAttribute("type","text/css"),a.setAttribute("href",this.theme),document.getElementsByTagName("head")[0].appendChild(a)}}this.controls==null&&(this.controls=[],OpenLayers.Control!=null&&(OpenLayers.Control.Navigation?this.controls.push(new OpenLayers.Control.Navigation):OpenLayers.Control.TouchNavigation&&this.controls.push(new OpenLayers.Control.TouchNavigation),OpenLayers.Control.Zoom?this.controls.push(new OpenLayers.Control.Zoom):OpenLayers.Control.PanZoom&&this.controls.push(new OpenLayers.Control.PanZoom),OpenLayers.Control.ArgParser&&this.controls.push(new OpenLayers.Control.ArgParser),OpenLayers.Control.Attribution&&this.controls.push(new OpenLayers.Control.Attribution)));for(var o=0,u=this.controls.length;o<u;o++)this.addControlToMap(this.controls[o]);this.popups=[],this.unloadDestroy=OpenLayers.Function.bind(this.destroy,this),OpenLayers.Event.observe(window,"unload",this.unloadDestroy),t&&t.layers&&(delete this.center,delete this.zoom,this.addLayers(t.layers),t.center&&!this.getCenter()&&this.setCenter(t.center,t.zoom)),this.panMethod&&(this.panTween=new OpenLayers.Tween(this.panMethod)),this.zoomMethod&&this.applyTransform.transform&&(this.zoomTween=new OpenLayers.Tween(this.zoomMethod))},getViewport:function(){return this.viewPortDiv},render:function(e){this.div=OpenLayers.Util.getElement(e),OpenLayers.Element.addClass(this.div,"olMap"),this.viewPortDiv.parentNode.removeChild(this.viewPortDiv),this.div.appendChild(this.viewPortDiv),this.updateSize()},unloadDestroy:null,updateSizeDestroy:null,destroy:function(){if(!this.unloadDestroy)return!1;this.panTween&&(this.panTween.stop(),this.panTween=null),this.zoomTween&&(this.zoomTween.stop(),this.zoomTween=null),OpenLayers.Event.stopObserving(window,"unload",this.unloadDestroy),this.unloadDestroy=null,this.updateSizeDestroy&&OpenLayers.Event.stopObserving(window,"resize",this.updateSizeDestroy),this.paddingForPopups=null;if(this.controls!=null){for(var e=this.controls.length-1;e>=0;--e)this.controls[e].destroy();this.controls=null}if(this.layers!=null){for(var e=this.layers.length-1;e>=0;--e)this.layers[e].destroy(!1);this.layers=null}this.viewPortDiv&&this.viewPortDiv.parentNode&&this.viewPortDiv.parentNode.removeChild(this.viewPortDiv),this.viewPortDiv=null,this.tileManager&&(this.tileManager.removeMap(this),this.tileManager=null),this.eventListeners&&(this.events.un(this.eventListeners),this.eventListeners=null),this.events.destroy(),this.events=null,this.options=null},setOptions:function(e){var t=this.minPx&&e.restrictedExtent!=this.restrictedExtent;OpenLayers.Util.extend(this,e),t&&this.moveTo(this.getCachedCenter(),this.zoom,{forceZoomChange:!0})},getTileSize:function(){return this.tileSize},getBy:function(e,t,n){var r=typeof n.test=="function",i=OpenLayers.Array.filter(this[e],function(e){return e[t]==n||r&&n.test(e[t])});return i},getLayersBy:function(e,t){return this.getBy("layers",e,t)},getLayersByName:function(e){return this.getLayersBy("name",e)},getLayersByClass:function(e){return this.getLayersBy("CLASS_NAME",e)},getControlsBy:function(e,t){return this.getBy("controls",e,t)},getControlsByClass:function(e){return this.getControlsBy("CLASS_NAME",e)},getLayer:function(e){var t=null;for(var n=0,r=this.layers.length;n<r;n++){var i=this.layers[n];if(i.id==e){t=i;break}}return t},setLayerZIndex:function(e,t){e.setZIndex(this.Z_INDEX_BASE[e.isBaseLayer?"BaseLayer":"Overlay"]+t*5)},resetLayersZIndex:function(){for(var e=0,t=this.layers.length;e<t;e++){var n=this.layers[e];this.setLayerZIndex(n,e)}},addLayer:function(e){for(var t=0,n=this.layers.length;t<n;t++)if(this.layers[t]==e)return!1;return this.events.triggerEvent("preaddlayer",{layer:e})===!1?!1:(this.allOverlays&&(e.isBaseLayer=!1),e.div.className="olLayerDiv",e.div.style.overflow="",this.setLayerZIndex(e,this.layers.length),e.isFixed?this.viewPortDiv.appendChild(e.div):this.layerContainerDiv.appendChild(e.div),this.layers.push(e),e.setMap(this),e.isBaseLayer||this.allOverlays&&!this.baseLayer?this.baseLayer==null?this.setBaseLayer(e):e.setVisibility(!1):e.redraw(),this.events.triggerEvent("addlayer",{layer:e}),e.events.triggerEvent("added",{map:this,layer:e}),e.afterAdd(),!0)},addLayers:function(e){for(var t=0,n=e.length;t<n;t++)this.addLayer(e[t])},removeLayer:function(e,t){if(this.events.triggerEvent("preremovelayer",{layer:e})===!1)return;t==null&&(t=!0),e.isFixed?this.viewPortDiv.removeChild(e.div):this.layerContainerDiv.removeChild(e.div),OpenLayers.Util.removeItem(this.layers,e),e.removeMap(this),e.map=null;if(this.baseLayer==e){this.baseLayer=null;if(t)for(var n=0,r=this.layers.length;n<r;n++){var i=this.layers[n];if(i.isBaseLayer||this.allOverlays){this.setBaseLayer(i);break}}}this.resetLayersZIndex(),this.events.triggerEvent("removelayer",{layer:e}),e.events.triggerEvent("removed",{map:this,layer:e})},getNumLayers:function(){return this.layers.length},getLayerIndex:function(e){return OpenLayers.Util.indexOf(this.layers,e)},setLayerIndex:function(e,t){var n=this.getLayerIndex(e);t<0?t=0:t>this.layers.length&&(t=this.layers.length);if(n!=t){this.layers.splice(n,1),this.layers.splice(t,0,e);for(var r=0,i=this.layers.length;r<i;r++)this.setLayerZIndex(this.layers[r],r);this.events.triggerEvent("changelayer",{layer:e,property:"order"}),this.allOverlays&&(t===0?this.setBaseLayer(e):this.baseLayer!==this.layers[0]&&this.setBaseLayer(this.layers[0]))}},raiseLayer:function(e,t){var n=this.getLayerIndex(e)+t;this.setLayerIndex(e,n)},setBaseLayer:function(e){if(e!=this.baseLayer&&OpenLayers.Util.indexOf(this.layers,e)!=-1){var t=this.getCachedCenter(),n=OpenLayers.Util.getResolutionFromScale(this.getScale(),e.units);this.baseLayer!=null&&!this.allOverlays&&this.baseLayer.setVisibility(!1),this.baseLayer=e;if(!this.allOverlays||this.baseLayer.visibility)this.baseLayer.setVisibility(!0),this.baseLayer.inRange===!1&&this.baseLayer.redraw();if(t!=null){var r=this.getZoomForResolution(n||this.resolution,!0);this.setCenter(t,r,!1,!0)}this.events.triggerEvent("changebaselayer",{layer:this.baseLayer})}},addControl:function(e,t){this.controls.push(e),this.addControlToMap(e,t)},addControls:function(e,t){var n=arguments.length===1?[]:t;for(var r=0,i=e.length;r<i;r++){var s=e[r],o=n[r]?n[r]:null;this.addControl(s,o)}},addControlToMap:function(e,t){e.outsideViewport=e.div!=null,this.displayProjection&&!e.displayProjection&&(e.displayProjection=this.displayProjection),e.setMap(this);var n=e.draw(t);n&&(e.outsideViewport||(n.style.zIndex=this.Z_INDEX_BASE.Control+this.controls.length,this.viewPortDiv.appendChild(n))),e.autoActivate&&e.activate()},getControl:function(e){var t=null;for(var n=0,r=this.controls.length;n<r;n++){var i=this.controls[n];if(i.id==e){t=i;break}}return t},removeControl:function(e){e&&e==this.getControl(e.id)&&(e.div&&e.div.parentNode==this.viewPortDiv&&this.viewPortDiv.removeChild(e.div),OpenLayers.Util.removeItem(this.controls,e))},addPopup:function(e,t){if(t)for(var n=this.popups.length-1;n>=0;--n)this.removePopup(this.popups[n]);e.map=this,this.popups.push(e);var r=e.draw();r&&(r.style.zIndex=this.Z_INDEX_BASE.Popup+this.popups.length,this.layerContainerDiv.appendChild(r))},removePopup:function(e){OpenLayers.Util.removeItem(this.popups,e);if(e.div)try{this.layerContainerDiv.removeChild(e.div)}catch(t){}e.map=null},getSize:function(){var e=null;return this.size!=null&&(e=this.size.clone()),e},updateSize:function(){var e=this.getCurrentSize();if(e&&!isNaN(e.h)&&!isNaN(e.w)){this.events.clearMouseCache();var t=this.getSize();t==null&&(this.size=t=e);if(!e.equals(t)){this.size=e;for(var n=0,r=this.layers.length;n<r;n++)this.layers[n].onMapResize();var i=this.getCachedCenter();if(this.baseLayer!=null&&i!=null){var s=this.getZoom();this.zoom=null,this.setCenter(i,s)}}}this.events.triggerEvent("updatesize")},getCurrentSize:function(){var e=new OpenLayers.Size(this.div.clientWidth,this.div.clientHeight);if(e.w==0&&e.h==0||isNaN(e.w)&&isNaN(e.h))e.w=this.div.offsetWidth,e.h=this.div.offsetHeight;if(e.w==0&&e.h==0||isNaN(e.w)&&isNaN(e.h))e.w=parseInt(this.div.style.width),e.h=parseInt(this.div.style.height);return e},calculateBounds:function(e,t){var n=null;e==null&&(e=this.getCachedCenter()),t==null&&(t=this.getResolution());if(e!=null&&t!=null){var r=this.size.w*t/2,i=this.size.h*t/2;n=new OpenLayers.Bounds(e.lon-r,e.lat-i,e.lon+r,e.lat+i)}return n},getCenter:function(){var e=null,t=this.getCachedCenter();return t&&(e=t.clone()),e},getCachedCenter:function(){return!this.center&&this.size&&(this.center=this.getLonLatFromViewPortPx({x:this.size.w/2,y:this.size.h/2})),this.center},getZoom:function(){return this.zoom},pan:function(e,t,n){n=OpenLayers.Util.applyDefaults(n,{animate:!0,dragging:!1});if(n.dragging)(e!=0||t!=0)&&this.moveByPx(e,t);else{var r=this.getViewPortPxFromLonLat(this.getCachedCenter()),i=r.add(e,t);if(this.dragging||!i.equals(r)){var s=this.getLonLatFromViewPortPx(i);n.animate?this.panTo(s):(this.moveTo(s),this.dragging&&(this.dragging=!1,this.events.triggerEvent("moveend")))}}},panTo:function(e){if(this.panTween&&this.getExtent().scale(this.panRatio).containsLonLat(e)){var t=this.getCachedCenter();if(e.equals(t))return;var n=this.getPixelFromLonLat(t),r=this.getPixelFromLonLat(e),i={x:r.x-n.x,y:r.y-n.y},s={x:0,y:0};this.panTween.start({x:0,y:0},i,this.panDuration,{callbacks:{eachStep:OpenLayers.Function.bind(function(e){var t=e.x-s.x,n=e.y-s.y;this.moveByPx(t,n),s.x=Math.round(e.x),s.y=Math.round(e.y)},this),done:OpenLayers.Function.bind(function(t){this.moveTo(e),this.dragging=!1,this.events.triggerEvent("moveend")},this)}})}else this.setCenter(e)},setCenter:function(e,t,n,r){this.panTween&&this.panTween.stop(),this.zoomTween&&this.zoomTween.stop(),this.moveTo(e,t,{dragging:n,forceZoomChange:r})},moveByPx:function(e,t){var n=this.size.w/2,r=this.size.h/2,i=n+e,s=r+t,o=this.baseLayer.wrapDateLine,u=0,a=0;this.restrictedExtent&&(u=n,a=r,o=!1),e=o||i<=this.maxPx.x-u&&i>=this.minPx.x+u?Math.round(e):0,t=s<=this.maxPx.y-a&&s>=this.minPx.y+a?Math.round(t):0;if(e||t){this.dragging||(this.dragging=!0,this.events.triggerEvent("movestart")),this.center=null,e&&(this.layerContainerOriginPx.x-=e,this.minPx.x-=e,this.maxPx.x-=e),t&&(this.layerContainerOriginPx.y-=t,this.minPx.y-=t,this.maxPx.y-=t),this.applyTransform();var f,l,c;for(l=0,c=this.layers.length;l<c;++l)f=this.layers[l],f.visibility&&(f===this.baseLayer||f.inRange)&&(f.moveByPx(e,t),f.events.triggerEvent("move"));this.events.triggerEvent("move")}},adjustZoom:function(e){if(this.baseLayer&&this.baseLayer.wrapDateLine){var t,n=this.baseLayer.resolutions,r=this.getMaxExtent().getWidth()/this.size.w;if(this.getResolutionForZoom(e)>r)if(this.fractionalZoom)e=this.getZoomForResolution(r);else for(var i=e|0,s=n.length;i<s;++i)if(n[i]<=r){e=i;break}}return e},getMinZoom:function(){return this.adjustZoom(0)},moveTo:function(e,t,n){e!=null&&!(e instanceof OpenLayers.LonLat)&&(e=new OpenLayers.LonLat(e)),n||(n={}),t!=null&&(t=parseFloat(t),this.fractionalZoom||(t=Math.round(t)));var r=t;t=this.adjustZoom(t),t!==r&&(e=this.getCenter());var i=n.dragging||this.dragging,s=n.forceZoomChange;!this.getCachedCenter()&&!this.isValidLonLat(e)&&(e=this.maxExtent.getCenterLonLat(),this.center=e.clone());if(this.restrictedExtent!=null){e==null&&(e=this.center),t==null&&(t=this.getZoom());var o=this.getResolutionForZoom(t),u=this.calculateBounds(e,o);if(!this.restrictedExtent.containsBounds(u)){var a=this.restrictedExtent.getCenterLonLat();u.getWidth()>this.restrictedExtent.getWidth()?e=new OpenLayers.LonLat(a.lon,e.lat):u.left<this.restrictedExtent.left?e=e.add(this.restrictedExtent.left-u.left,0):u.right>this.restrictedExtent.right&&(e=e.add(this.restrictedExtent.right-u.right,0)),u.getHeight()>this.restrictedExtent.getHeight()?e=new OpenLayers.LonLat(e.lon,a.lat):u.bottom<this.restrictedExtent.bottom?e=e.add(0,this.restrictedExtent.bottom-u.bottom):u.top>this.restrictedExtent.top&&(e=e.add(0,this.restrictedExtent.top-u.top))}}var f=s||this.isValidZoomLevel(t)&&t!=this.getZoom(),l=this.isValidLonLat(e)&&!e.equals(this.center);if(f||l||i){i||this.events.triggerEvent("movestart",{zoomChanged:f}),l&&(!f&&this.center&&this.centerLayerContainer(e),this.center=e.clone());var c=f?this.getResolutionForZoom(t):this.getResolution();if(f||this.layerContainerOrigin==null){this.layerContainerOrigin=this.getCachedCenter(),this.layerContainerOriginPx.x=0,this.layerContainerOriginPx.y=0,this.applyTransform();var h=this.getMaxExtent({restricted:!0}),p=h.getCenterLonLat(),d=this.center.lon-p.lon,v=p.lat-this.center.lat,m=Math.round(h.getWidth()/c),g=Math.round(h.getHeight()/c);this.minPx={x:(this.size.w-m)/2-d/c,y:(this.size.h-g)/2-v/c},this.maxPx={x:this.minPx.x+Math.round(h.getWidth()/c),y:this.minPx.y+Math.round(h.getHeight()/c)}}f&&(this.zoom=t,this.resolution=c);var y=this.getExtent();this.baseLayer.visibility&&(this.baseLayer.moveTo(y,f,n.dragging),n.dragging||this.baseLayer.events.triggerEvent("moveend",{zoomChanged:f})),y=this.baseLayer.getExtent();for(var b=this.layers.length-1;b>=0;--b){var w=this.layers[b];if(w!==this.baseLayer&&!w.isBaseLayer){var E=w.calculateInRange();w.inRange!=E&&(w.inRange=E,E||w.display(!1),this.events.triggerEvent("changelayer",{layer:w,property:"visibility"})),E&&w.visibility&&(w.moveTo(y,f,n.dragging),n.dragging||w.events.triggerEvent("moveend",{zoomChanged:f}))}}this.events.triggerEvent("move"),i||this.events.triggerEvent("moveend");if(f){for(var b=0,S=this.popups.length;b<S;b++)this.popups[b].updatePosition();this.events.triggerEvent("zoomend")}}},centerLayerContainer:function(e){var t=this.getViewPortPxFromLonLat(this.layerContainerOrigin),n=this.getViewPortPxFromLonLat(e);if(t!=null&&n!=null){var r=this.layerContainerOriginPx.x,i=this.layerContainerOriginPx.y,s=Math.round(t.x-n.x),o=Math.round(t.y-n.y);this.applyTransform(this.layerContainerOriginPx.x=s,this.layerContainerOriginPx.y=o);var u=r-s,a=i-o;this.minPx.x-=u,this.maxPx.x-=u,this.minPx.y-=a,this.maxPx.y-=a}},isValidZoomLevel:function(e){return e!=null&&e>=0&&e<this.getNumZoomLevels()},isValidLonLat:function(e){var t=!1;if(e!=null){var n=this.getMaxExtent(),r=this.baseLayer.wrapDateLine&&n;t=n.containsLonLat(e,{worldBounds:r})}return t},getProjection:function(){var e=this.getProjectionObject();return e?e.getCode():null},getProjectionObject:function(){var e=null;return this.baseLayer!=null&&(e=this.baseLayer.projection),e},getMaxResolution:function(){var e=null;return this.baseLayer!=null&&(e=this.baseLayer.maxResolution),e},getMaxExtent:function(e){var t=null;return e&&e.restricted&&this.restrictedExtent?t=this.restrictedExtent:this.baseLayer!=null&&(t=this.baseLayer.maxExtent),t},getNumZoomLevels:function(){var e=null;return this.baseLayer!=null&&(e=this.baseLayer.numZoomLevels),e},getExtent:function(){var e=null;return this.baseLayer!=null&&(e=this.baseLayer.getExtent()),e},getResolution:function(){var e=null;return this.baseLayer!=null?e=this.baseLayer.getResolution():this.allOverlays===!0&&this.layers.length>0&&(e=this.layers[0].getResolution()),e},getUnits:function(){var e=null;return this.baseLayer!=null&&(e=this.baseLayer.units),e},getScale:function(){var e=null;if(this.baseLayer!=null){var t=this.getResolution(),n=this.baseLayer.units;e=OpenLayers.Util.getScaleFromResolution(t,n)}return e},getZoomForExtent:function(e,t){var n=null;return this.baseLayer!=null&&(n=this.baseLayer.getZoomForExtent(e,t)),n},getResolutionForZoom:function(e){var t=null;return this.baseLayer&&(t=this.baseLayer.getResolutionForZoom(e)),t},getZoomForResolution:function(e,t){var n=null;return this.baseLayer!=null&&(n=this.baseLayer.getZoomForResolution(e,t)),n},zoomTo:function(e,t){var n=this;if(n.isValidZoomLevel(e)){n.baseLayer.wrapDateLine&&(e=n.adjustZoom(e));if(n.zoomTween){var r=n.getResolution(),i=n.getResolutionForZoom(e),s={scale:1},o={scale:r/i};if(n.zoomTween.playing&&n.zoomTween.duration<3*n.zoomDuration)n.zoomTween.finish={scale:n.zoomTween.finish.scale*o.scale};else{if(!t){var u=n.getSize();t={x:u.w/2,y:u.h/2}}n.zoomTween.start(s,o,n.zoomDuration,{minFrameRate:50,callbacks:{eachStep:function(e){var r=n.layerContainerOriginPx,i=e.scale,s=(i-1)*(r.x-t.x)|0,o=(i-1)*(r.y-t.y)|0;n.applyTransform(r.x+s,r.y+o,i)},done:function(e){n.applyTransform();var r=n.getResolution()/e.scale,i=n.getZoomForResolution(r,!0);n.moveTo(n.getZoomTargetCenter(t,r),i,!0)}}})}}else{var a=t?n.getZoomTargetCenter(t,n.getResolutionForZoom(e)):null;n.setCenter(a,e)}}},zoomIn:function(){this.zoomTo(this.getZoom()+1)},zoomOut:function(){this.zoomTo(this.getZoom()-1)},zoomToExtent:function(e,t){e instanceof OpenLayers.Bounds||(e=new OpenLayers.Bounds(e));var n=e.getCenterLonLat();if(this.baseLayer.wrapDateLine){var r=this.getMaxExtent();e=e.clone();while(e.right<e.left)e.right+=r.getWidth();n=e.getCenterLonLat().wrapDateLine(r)}this.setCenter(n,this.getZoomForExtent(e,t))},zoomToMaxExtent:function(e){var t=e?e.restricted:!0,n=this.getMaxExtent({restricted:t});this.zoomToExtent(n)},zoomToScale:function(e,t){var n=OpenLayers.Util.getResolutionFromScale(e,this.baseLayer.units),r=this.size.w*n/2,i=this.size.h*n/2,s=this.getCachedCenter(),o=new OpenLayers.Bounds(s.lon-r,s.lat-i,s.lon+r,s.lat+i);this.zoomToExtent(o,t)},getLonLatFromViewPortPx:function(e){var t=null;return this.baseLayer!=null&&(t=this.baseLayer.getLonLatFromViewPortPx(e)),t},getViewPortPxFromLonLat:function(e){var t=null;return this.baseLayer!=null&&(t=this.baseLayer.getViewPortPxFromLonLat(e)),t},getZoomTargetCenter:function(e,t){var n=null,r=this.getSize(),i=r.w/2-e.x,s=e.y-r.h/2,o=this.getLonLatFromPixel(e);return o&&(n=new OpenLayers.LonLat(o.lon+i*t,o.lat+s*t)),n},getLonLatFromPixel:function(e){return this.getLonLatFromViewPortPx(e)},getPixelFromLonLat:function(e){var t=this.getViewPortPxFromLonLat(e);return t.x=Math.round(t.x),t.y=Math.round(t.y),t},getGeodesicPixelSize:function(e){var t=e?this.getLonLatFromPixel(e):this.getCachedCenter()||new OpenLayers.LonLat(0,0),n=this.getResolution(),r=t.add(-n/2,0),i=t.add(n/2,0),s=t.add(0,-n/2),o=t.add(0,n/2),u=new OpenLayers.Projection("EPSG:4326"),a=this.getProjectionObject()||u;return a.equals(u)||(r.transform(a,u),i.transform(a,u),s.transform(a,u),o.transform(a,u)),new OpenLayers.Size(OpenLayers.Util.distVincenty(r,i),OpenLayers.Util.distVincenty(s,o))},getViewPortPxFromLayerPx:function(e){var t=null;if(e!=null){var n=this.layerContainerOriginPx.x,r=this.layerContainerOriginPx.y;t=e.add(n,r)}return t},getLayerPxFromViewPortPx:function(e){var t=null;if(e!=null){var n=-this.layerContainerOriginPx.x,r=-this.layerContainerOriginPx.y;t=e.add(n,r);if(isNaN(t.x)||isNaN(t.y))t=null}return t},getLonLatFromLayerPx:function(e){return e=this.getViewPortPxFromLayerPx(e),this.getLonLatFromViewPortPx(e)},getLayerPxFromLonLat:function(e){var t=this.getPixelFromLonLat(e);return this.getLayerPxFromViewPortPx(t)},applyTransform:function(e,t,n){n=n||1;var r=this.layerContainerOriginPx,i=n!==1;e=e||r.x,t=t||r.y;var s=this.layerContainerDiv.style,o=this.applyTransform.transform,u=this.applyTransform.template;if(o===undefined){o=OpenLayers.Util.vendorPrefix.style("transform"),this.applyTransform.transform=o;if(o){var a=OpenLayers.Element.getStyle(this.viewPortDiv,OpenLayers.Util.vendorPrefix.css("transform"));if(!a||a!=="none")u=["translate3d(",",0) ","scale3d(",",1)"],s[o]=[u[0],"0,0",u[1]].join("");if(!u||!~s[o].indexOf(u[0]))u=["translate(",") ","scale(",")"];this.applyTransform.template=u}}o===null||u[0]!=="translate3d("&&i!==!0?(s.left=e+"px",s.top=t+"px",o!==null&&(s[o]="")):(i===!0&&u[0]==="translate("&&(e-=r.x,t-=r.y,s.left=r.x+"px",s.top=r.y+"px"),s[o]=[u[0],e,"px,",t,"px",u[1],u[2],n,",",n,u[3]].join(""))},CLASS_NAME:"OpenLayers.Map"}),OpenLayers.Map.TILE_WIDTH=256,OpenLayers.Map.TILE_HEIGHT=256;