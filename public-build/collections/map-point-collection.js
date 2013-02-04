define(["jquery","underscore","backbone","models/point"],function(e,t,n,r){var i=n.Collection.extend({model:r,comparator:function(e){return e.get("datetime")},initialize:function(t){this.pointCollectionId=t.pointCollectionId,this.baseUrl="/api/mappoints/"+t.mapId+"/"+this.pointCollectionId,this.mapLayer=t.mapLayer,this.urlParams=t.urlParams?e.extend({},t.urlParams):{},this.fetched=this.visibleMapAreaFetched=!1},url:function(){return this.baseUrl+"?"+genQueryString(this.urlParams)},setVisibleMapArea:function(e){console.log("MapPointCollection.setVisibleMapArea "+this.pointCollectionId),this.urlParams.b=[e.bounds[0][0],e.bounds[0][1],e.bounds[1][0],e.bounds[1][1]],this.urlParams.z=e.zoom,this.visibleMapAreaFetched=!1},fetch:function(e){return console.log("MapPointCollection.fetch "+this.pointCollectionId),i.__super__.fetch.call(this,e)},parse:function(e,t){return e.items&&(this.fullCount=e.fullCount,this.maxReducedCount=e.maxReducedCount,this.resultCount=e.resultCount,this.originalCount=e.originalCount,this.gridSize=e.gridSize,e=e.items),this.fetched=this.visibleMapAreaFetched=!0,i.__super__.parse.call(this,e,t)},addData:function(t,n){var r=this;e.ajax({type:"POST",dataType:"json",data:t,url:"/api/addpoints/"+this.pointCollectionId,success:function(){console.log("Adding points for: "+r.pointCollectionId),n()},error:function(){console.error("failed to add point bundle")}})},unbindCollection:function(){console.log("unbinding "+this.pointCollectionId);var t=this;e.ajax({type:"POST",url:"/api/unbindmapcollection/"+app.mapInfo._id+"/"+t.pointCollectionId,success:function(e){},error:function(){console.error("failed to unbind collection")}})},destroy:function(t){var n=this;e.ajax({type:"DELETE",url:this.url,success:function(){console.log("Removed collection: "+n.pointCollectionId)},error:function(){console.error("failed to remove collection: "+n.pointCollectionId)}}),this.destroyAssociativeIndex(t)},destroyAssociativeIndex:function(){var t=this;e.ajax({type:"DELETE",url:"/api/pointcollection/"+this.pointCollectionId,success:function(e){console.log("Destroyed associated collection: "+t.pointCollectionId)},error:function(){console.error("Failed to destroy associated collection: "+t.pointCollectionId)}})}});return i});