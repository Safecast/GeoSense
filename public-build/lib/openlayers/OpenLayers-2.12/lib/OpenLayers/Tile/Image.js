/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Tile.Image=OpenLayers.Class(OpenLayers.Tile,{url:null,imgDiv:null,frame:null,imageReloadAttempts:null,layerAlphaHack:null,asyncRequestId:null,blankImageUrl:"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAQAIBRAA7",maxGetUrlLength:null,canvasContext:null,crossOriginKeyword:null,initialize:function(e,t,n,r,i,s){OpenLayers.Tile.prototype.initialize.apply(this,arguments),this.url=r,this.layerAlphaHack=this.layer.alpha&&OpenLayers.Util.alphaHack();if(this.maxGetUrlLength!=null||this.layer.gutter||this.layerAlphaHack)this.frame=document.createElement("div"),this.frame.style.position="absolute",this.frame.style.overflow="hidden";this.maxGetUrlLength!=null&&OpenLayers.Util.extend(this,OpenLayers.Tile.Image.IFrame)},destroy:function(){this.imgDiv&&(this.clear(),this.imgDiv=null,this.frame=null),this.asyncRequestId=null,OpenLayers.Tile.prototype.destroy.apply(this,arguments)},draw:function(){var e=OpenLayers.Tile.prototype.draw.apply(this,arguments);return e?(this.layer!=this.layer.map.baseLayer&&this.layer.reproject&&(this.bounds=this.getBoundsFromBaseLayer(this.position)),this.isLoading?this._loadEvent="reload":(this.isLoading=!0,this._loadEvent="loadstart"),this.positionTile(),this.renderTile()):this.unload(),e},renderTile:function(){this.layer.div.appendChild(this.getTile());if(this.layer.async){var e=this.asyncRequestId=(this.asyncRequestId||0)+1;this.layer.getURLasync(this.bounds,function(t){e==this.asyncRequestId&&(this.url=t,this.initImage())},this)}else this.url=this.layer.getURL(this.bounds),this.initImage()},positionTile:function(){var e=this.getTile().style,t=this.frame?this.size:this.layer.getImageSize(this.bounds);e.left=this.position.x+"%",e.top=this.position.y+"%",e.width=t.w+"%",e.height=t.h+"%"},clear:function(){OpenLayers.Tile.prototype.clear.apply(this,arguments);var e=this.imgDiv;if(e){OpenLayers.Event.stopObservingElement(e);var t=this.getTile();t.parentNode===this.layer.div&&this.layer.div.removeChild(t),this.setImgSrc(),this.layerAlphaHack===!0&&(e.style.filter=""),OpenLayers.Element.removeClass(e,"olImageLoadError")}this.canvasContext=null},getImage:function(){if(!this.imgDiv){this.imgDiv=document.createElement("img"),this.imgDiv.className="olTileImage",this.imgDiv.galleryImg="no";var e=this.imgDiv.style;if(this.frame){var t=0,n=0;this.layer.gutter&&(t=this.layer.gutter/this.layer.tileSize.w*100,n=this.layer.gutter/this.layer.tileSize.h*100),e.left=-t+"%",e.top=-n+"%",e.width=2*t+100+"%",e.height=2*n+100+"%"}e.visibility="hidden",e.opacity=0,this.layer.opacity<1&&(e.filter="alpha(opacity="+this.layer.opacity*100+")"),e.position="absolute",this.layerAlphaHack&&(e.paddingTop=e.height,e.height="0",e.width="100%"),this.frame&&this.frame.appendChild(this.imgDiv)}return this.imgDiv},initImage:function(){this.events.triggerEvent(this._loadEvent);var e=this.getImage();if(this.url&&e.getAttribute("src")==this.url)this.onImageLoad();else{var t=OpenLayers.Function.bind(function(){OpenLayers.Event.stopObservingElement(e),OpenLayers.Event.observe(e,"load",OpenLayers.Function.bind(this.onImageLoad,this)),OpenLayers.Event.observe(e,"error",OpenLayers.Function.bind(this.onImageError,this)),this.imageReloadAttempts=0,this.setImgSrc(this.url)},this);e.getAttribute("src")==this.blankImageUrl?t():(OpenLayers.Event.observe(e,"load",t),OpenLayers.Event.observe(e,"error",t),this.crossOriginKeyword&&e.removeAttribute("crossorigin"),e.src=this.blankImageUrl)}},setImgSrc:function(e){var t=this.imgDiv;t.style.visibility="hidden",t.style.opacity=0,e&&(this.crossOriginKeyword&&(e.substr(0,5)!=="data:"?t.setAttribute("crossorigin",this.crossOriginKeyword):t.removeAttribute("crossorigin")),t.src=e)},getTile:function(){return this.frame?this.frame:this.getImage()},createBackBuffer:function(){if(!this.imgDiv||this.isLoading)return;var e;return this.frame?(e=this.frame.cloneNode(!1),e.appendChild(this.imgDiv)):e=this.imgDiv,this.imgDiv=null,e},onImageLoad:function(){var e=this.imgDiv;OpenLayers.Event.stopObservingElement(e),e.style.visibility="inherit",e.style.opacity=this.layer.opacity,this.isLoading=!1,this.canvasContext=null,this.events.triggerEvent("loadend");if(parseFloat(navigator.appVersion.split("MSIE")[1])<7&&this.layer&&this.layer.div){var t=document.createElement("span");t.style.display="none";var n=this.layer.div;n.appendChild(t),window.setTimeout(function(){t.parentNode===n&&t.parentNode.removeChild(t)},0)}this.layerAlphaHack===!0&&(e.style.filter="progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+e.src+"', sizingMethod='scale')")},onImageError:function(){var e=this.imgDiv;e.src!=null&&(this.imageReloadAttempts++,this.imageReloadAttempts<=OpenLayers.IMAGE_RELOAD_ATTEMPTS?this.setImgSrc(this.layer.getURL(this.bounds)):(OpenLayers.Element.addClass(e,"olImageLoadError"),this.events.triggerEvent("loaderror"),this.onImageLoad()))},getCanvasContext:function(){if(OpenLayers.CANVAS_SUPPORTED&&this.imgDiv&&!this.isLoading){if(!this.canvasContext){var e=document.createElement("canvas");e.width=this.size.w,e.height=this.size.h,this.canvasContext=e.getContext("2d"),this.canvasContext.drawImage(this.imgDiv,0,0)}return this.canvasContext}},CLASS_NAME:"OpenLayers.Tile.Image"});