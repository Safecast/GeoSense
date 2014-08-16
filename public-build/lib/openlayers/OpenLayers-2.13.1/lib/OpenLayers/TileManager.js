/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.TileManager=OpenLayers.Class({cacheSize:256,tilesPerFrame:2,frameDelay:16,moveDelay:100,zoomDelay:200,maps:null,tileQueueId:null,tileQueue:null,tileCache:null,tileCacheIndex:null,initialize:function(e){OpenLayers.Util.extend(this,e),this.maps=[],this.tileQueueId={},this.tileQueue={},this.tileCache={},this.tileCacheIndex=[]},addMap:function(e){if(this._destroyed||!OpenLayers.Layer.Grid)return;this.maps.push(e),this.tileQueue[e.id]=[];for(var t=0,n=e.layers.length;t<n;++t)this.addLayer({layer:e.layers[t]});e.events.on({move:this.move,zoomend:this.zoomEnd,changelayer:this.changeLayer,addlayer:this.addLayer,preremovelayer:this.removeLayer,scope:this})},removeMap:function(e){if(this._destroyed||!OpenLayers.Layer.Grid)return;window.clearTimeout(this.tileQueueId[e.id]);if(e.layers)for(var t=0,n=e.layers.length;t<n;++t)this.removeLayer({layer:e.layers[t]});e.events&&e.events.un({move:this.move,zoomend:this.zoomEnd,changelayer:this.changeLayer,addlayer:this.addLayer,preremovelayer:this.removeLayer,scope:this}),delete this.tileQueue[e.id],delete this.tileQueueId[e.id],OpenLayers.Util.removeItem(this.maps,e)},move:function(e){this.updateTimeout(e.object,this.moveDelay,!0)},zoomEnd:function(e){this.updateTimeout(e.object,this.zoomDelay)},changeLayer:function(e){(e.property==="visibility"||e.property==="params")&&this.updateTimeout(e.object,0)},addLayer:function(e){var t=e.layer;if(t instanceof OpenLayers.Layer.Grid){t.events.on({addtile:this.addTile,retile:this.clearTileQueue,scope:this});var n,r,i;for(n=t.grid.length-1;n>=0;--n)for(r=t.grid[n].length-1;r>=0;--r)i=t.grid[n][r],this.addTile({tile:i}),i.url&&!i.imgDiv&&this.manageTileCache({object:i})}},removeLayer:function(e){var t=e.layer;if(t instanceof OpenLayers.Layer.Grid){this.clearTileQueue({object:t}),t.events&&t.events.un({addtile:this.addTile,retile:this.clearTileQueue,scope:this});if(t.grid){var n,r,i;for(n=t.grid.length-1;n>=0;--n)for(r=t.grid[n].length-1;r>=0;--r)i=t.grid[n][r],this.unloadTile({object:i})}}},updateTimeout:function(e,t,n){window.clearTimeout(this.tileQueueId[e.id]);var r=this.tileQueue[e.id];if(!n||r.length)this.tileQueueId[e.id]=window.setTimeout(OpenLayers.Function.bind(function(){this.drawTilesFromQueue(e),r.length&&this.updateTimeout(e,this.frameDelay)},this),t)},addTile:function(e){e.tile instanceof OpenLayers.Tile.Image?e.tile.events.on({beforedraw:this.queueTileDraw,beforeload:this.manageTileCache,loadend:this.addToCache,unload:this.unloadTile,scope:this}):this.removeLayer({layer:e.tile.layer})},unloadTile:function(e){var t=e.object;t.events.un({beforedraw:this.queueTileDraw,beforeload:this.manageTileCache,loadend:this.addToCache,unload:this.unloadTile,scope:this}),OpenLayers.Util.removeItem(this.tileQueue[t.layer.map.id],t)},queueTileDraw:function(e){var t=e.object,n=!1,r=t.layer,i=r.getURL(t.bounds),s=this.tileCache[i];s&&s.className!=="olTileImage"&&(delete this.tileCache[i],OpenLayers.Util.removeItem(this.tileCacheIndex,i),s=null);if(r.url&&(r.async||!s)){var o=this.tileQueue[r.map.id];~OpenLayers.Util.indexOf(o,t)||o.push(t),n=!0}return!n},drawTilesFromQueue:function(e){var t=this.tileQueue[e.id],n=this.tilesPerFrame,r=e.zoomTween&&e.zoomTween.playing;while(!r&&t.length&&n)t.shift().draw(!0),--n},manageTileCache:function(e){var t=e.object,n=this.tileCache[t.url];n&&(n.parentNode&&OpenLayers.Element.hasClass(n.parentNode,"olBackBuffer")&&(n.parentNode.removeChild(n),n.id=null),n.parentNode||(n.style.visibility="hidden",n.style.opacity=0,t.setImage(n),OpenLayers.Util.removeItem(this.tileCacheIndex,t.url),this.tileCacheIndex.push(t.url)))},addToCache:function(e){var t=e.object;this.tileCache[t.url]||OpenLayers.Element.hasClass(t.imgDiv,"olImageLoadError")||(this.tileCacheIndex.length>=this.cacheSize&&(delete this.tileCache[this.tileCacheIndex[0]],this.tileCacheIndex.shift()),this.tileCache[t.url]=t.imgDiv,this.tileCacheIndex.push(t.url))},clearTileQueue:function(e){var t=e.object,n=this.tileQueue[t.map.id];for(var r=n.length-1;r>=0;--r)n[r].layer===t&&n.splice(r,1)},destroy:function(){for(var e=this.maps.length-1;e>=0;--e)this.removeMap(this.maps[e]);this.maps=null,this.tileQueue=null,this.tileQueueId=null,this.tileCache=null,this.tileCacheIndex=null,this._destroyed=!0}});