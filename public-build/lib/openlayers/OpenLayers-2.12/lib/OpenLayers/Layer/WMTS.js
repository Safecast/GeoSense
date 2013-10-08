/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Layer.WMTS=OpenLayers.Class(OpenLayers.Layer.Grid,{isBaseLayer:!0,version:"1.0.0",requestEncoding:"KVP",url:null,layer:null,matrixSet:null,style:null,format:"image/jpeg",tileOrigin:null,tileFullExtent:null,formatSuffix:null,matrixIds:null,dimensions:null,params:null,zoomOffset:0,serverResolutions:null,formatSuffixMap:{"image/png":"png","image/png8":"png","image/png24":"png","image/png32":"png",png:"png","image/jpeg":"jpg","image/jpg":"jpg",jpeg:"jpg",jpg:"jpg"},matrix:null,initialize:function(e){var t={url:!0,layer:!0,style:!0,matrixSet:!0};for(var n in t)if(!(n in e))throw new Error("Missing property '"+n+"' in layer configuration.");e.params=OpenLayers.Util.upperCaseObject(e.params);var r=[e.name,e.url,e.params,e];OpenLayers.Layer.Grid.prototype.initialize.apply(this,r),this.formatSuffix||(this.formatSuffix=this.formatSuffixMap[this.format]||this.format.split("/").pop());if(this.matrixIds){var i=this.matrixIds.length;if(i&&typeof this.matrixIds[0]=="string"){var s=this.matrixIds;this.matrixIds=new Array(i);for(var o=0;o<i;++o)this.matrixIds[o]={identifier:s[o]}}}},setMap:function(){OpenLayers.Layer.Grid.prototype.setMap.apply(this,arguments),this.updateMatrixProperties()},updateMatrixProperties:function(){this.matrix=this.getMatrix(),this.matrix&&(this.matrix.topLeftCorner&&(this.tileOrigin=this.matrix.topLeftCorner),this.matrix.tileWidth&&this.matrix.tileHeight&&(this.tileSize=new OpenLayers.Size(this.matrix.tileWidth,this.matrix.tileHeight)),this.tileOrigin||(this.tileOrigin=new OpenLayers.LonLat(this.maxExtent.left,this.maxExtent.top)),this.tileFullExtent||(this.tileFullExtent=this.maxExtent))},moveTo:function(e,t,n){return(t||!this.matrix)&&this.updateMatrixProperties(),OpenLayers.Layer.Grid.prototype.moveTo.apply(this,arguments)},clone:function(e){return e==null&&(e=new OpenLayers.Layer.WMTS(this.options)),e=OpenLayers.Layer.Grid.prototype.clone.apply(this,[e]),e},getIdentifier:function(){return this.getServerZoom()},getMatrix:function(){var e;if(!this.matrixIds||this.matrixIds.length===0)e={identifier:this.getIdentifier()};else if("scaleDenominator"in this.matrixIds[0]){var t=OpenLayers.METERS_PER_INCH*OpenLayers.INCHES_PER_UNIT[this.units]*this.getServerResolution()/28e-5,n=Number.POSITIVE_INFINITY,r;for(var i=0,s=this.matrixIds.length;i<s;++i)r=Math.abs(1-this.matrixIds[i].scaleDenominator/t),r<n&&(n=r,e=this.matrixIds[i])}else e=this.matrixIds[this.getIdentifier()];return e},getTileInfo:function(e){var t=this.getServerResolution(),n=(e.lon-this.tileOrigin.lon)/(t*this.tileSize.w),r=(this.tileOrigin.lat-e.lat)/(t*this.tileSize.h),i=Math.floor(n),s=Math.floor(r);return{col:i,row:s,i:Math.floor((n-i)*this.tileSize.w),j:Math.floor((r-s)*this.tileSize.h)}},getURL:function(e){e=this.adjustBounds(e);var t="";if(!this.tileFullExtent||this.tileFullExtent.intersectsBounds(e)){var n=e.getCenterLonLat(),r=this.getTileInfo(n),i=this.matrix.identifier,s=this.dimensions,o;if(this.requestEncoding.toUpperCase()==="REST"){o=this.params;if(typeof this.url=="string"&&this.url.indexOf("{")!==-1){var u=this.url.replace(/\{/g,"${"),a={style:this.style,Style:this.style,TileMatrixSet:this.matrixSet,TileMatrix:this.matrix.identifier,TileRow:r.row,TileCol:r.col};if(s){var f,l;for(l=s.length-1;l>=0;--l)f=s[l],a[f]=o[f.toUpperCase()]}t=OpenLayers.String.format(u,a)}else{var c=this.version+"/"+this.layer+"/"+this.style+"/";if(s)for(var l=0;l<s.length;l++)o[s[l]]&&(c=c+o[s[l]]+"/");c=c+this.matrixSet+"/"+this.matrix.identifier+"/"+r.row+"/"+r.col+"."+this.formatSuffix,OpenLayers.Util.isArray(this.url)?t=this.selectUrl(c,this.url):t=this.url,t.match(/\/$/)||(t+="/"),t+=c}}else this.requestEncoding.toUpperCase()==="KVP"&&(o={SERVICE:"WMTS",REQUEST:"GetTile",VERSION:this.version,LAYER:this.layer,STYLE:this.style,TILEMATRIXSET:this.matrixSet,TILEMATRIX:this.matrix.identifier,TILEROW:r.row,TILECOL:r.col,FORMAT:this.format},t=OpenLayers.Layer.Grid.prototype.getFullRequestString.apply(this,[o]))}return t},mergeNewParams:function(e){if(this.requestEncoding.toUpperCase()==="KVP")return OpenLayers.Layer.Grid.prototype.mergeNewParams.apply(this,[OpenLayers.Util.upperCaseObject(e)])},CLASS_NAME:"OpenLayers.Layer.WMTS"});