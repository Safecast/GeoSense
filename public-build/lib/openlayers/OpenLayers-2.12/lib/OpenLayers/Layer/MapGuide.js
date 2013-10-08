/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Layer.MapGuide=OpenLayers.Class(OpenLayers.Layer.Grid,{isBaseLayer:!0,useHttpTile:!1,singleTile:!1,useOverlay:!1,useAsyncOverlay:!0,TILE_PARAMS:{operation:"GETTILEIMAGE",version:"1.2.0"},SINGLE_TILE_PARAMS:{operation:"GETMAPIMAGE",format:"PNG",locale:"en",clip:"1",version:"1.0.0"},OVERLAY_PARAMS:{operation:"GETDYNAMICMAPOVERLAYIMAGE",format:"PNG",locale:"en",clip:"1",version:"2.0.0"},FOLDER_PARAMS:{tileColumnsPerFolder:30,tileRowsPerFolder:30,format:"png",querystring:null},defaultSize:new OpenLayers.Size(300,300),tileOriginCorner:"tl",initialize:function(e,t,n,r){OpenLayers.Layer.Grid.prototype.initialize.apply(this,arguments);if(r==null||r.isBaseLayer==null)this.isBaseLayer=this.transparent!="true"&&this.transparent!=1;r&&r.useOverlay!=null&&(this.useOverlay=r.useOverlay),this.singleTile?this.useOverlay?(OpenLayers.Util.applyDefaults(this.params,this.OVERLAY_PARAMS),this.useAsyncOverlay||(this.params.version="1.0.0")):OpenLayers.Util.applyDefaults(this.params,this.SINGLE_TILE_PARAMS):(this.useHttpTile?OpenLayers.Util.applyDefaults(this.params,this.FOLDER_PARAMS):OpenLayers.Util.applyDefaults(this.params,this.TILE_PARAMS),this.setTileSize(this.defaultSize))},clone:function(e){return e==null&&(e=new OpenLayers.Layer.MapGuide(this.name,this.url,this.params,this.getOptions())),e=OpenLayers.Layer.Grid.prototype.clone.apply(this,[e]),e},getURL:function(e){var t,n=e.getCenterLonLat(),r=this.map.getSize();if(this.singleTile){var i={setdisplaydpi:OpenLayers.DOTS_PER_INCH,setdisplayheight:r.h*this.ratio,setdisplaywidth:r.w*this.ratio,setviewcenterx:n.lon,setviewcentery:n.lat,setviewscale:this.map.getScale()};if(this.useOverlay&&!this.useAsyncOverlay){var s={};s=OpenLayers.Util.extend(s,i),s.operation="GETVISIBLEMAPEXTENT",s.version="1.0.0",s.session=this.params.session,s.mapName=this.params.mapName,s.format="text/xml",t=this.getFullRequestString(s),OpenLayers.Request.GET({url:t,async:!1})}t=this.getFullRequestString(i)}else{var o=this.map.getResolution(),u=Math.floor((e.left-this.maxExtent.left)/o);u=Math.round(u/this.tileSize.w);var a=Math.floor((this.maxExtent.top-e.top)/o);a=Math.round(a/this.tileSize.h),this.useHttpTile?t=this.getImageFilePath({tilecol:u,tilerow:a,scaleindex:this.resolutions.length-this.map.zoom-1}):t=this.getFullRequestString({tilecol:u,tilerow:a,scaleindex:this.resolutions.length-this.map.zoom-1})}return t},getFullRequestString:function(e,t){var n=t==null?this.url:t;typeof n=="object"&&(n=n[Math.floor(Math.random()*n.length)]);var r=n,i=OpenLayers.Util.extend({},this.params);i=OpenLayers.Util.extend(i,e);var s=OpenLayers.Util.upperCaseObject(OpenLayers.Util.getParameters(n));for(var o in i)o.toUpperCase()in s&&delete i[o];var u=OpenLayers.Util.getParameterString(i);u=u.replace(/,/g,"+");if(u!=""){var a=n.charAt(n.length-1);a=="&"||a=="?"?r+=u:n.indexOf("?")==-1?r+="?"+u:r+="&"+u}return r},getImageFilePath:function(e,t){var n=t==null?this.url:t;typeof n=="object"&&(n=n[Math.floor(Math.random()*n.length)]);var r=n,i="",s="";e.tilerow<0&&(i="-"),e.tilerow==0?i+="0":i+=Math.floor(Math.abs(e.tilerow/this.params.tileRowsPerFolder))*this.params.tileRowsPerFolder,e.tilecol<0&&(s="-"),e.tilecol==0?s+="0":s+=Math.floor(Math.abs(e.tilecol/this.params.tileColumnsPerFolder))*this.params.tileColumnsPerFolder;var o="/S"+Math.floor(e.scaleindex)+"/"+this.params.basemaplayergroupname+"/R"+i+"/C"+s+"/"+e.tilerow%this.params.tileRowsPerFolder+"_"+e.tilecol%this.params.tileColumnsPerFolder+"."+this.params.format;return this.params.querystring&&(o+="?"+this.params.querystring),r+=o,r},calculateGridLayout:function(e,t,n){var r=n*this.tileSize.w,i=n*this.tileSize.h,s=e.left-t.lon,o=Math.floor(s/r)-this.buffer,u=s/r-o,a=-u*this.tileSize.w,f=t.lon+o*r,l=t.lat-e.top+i,c=Math.floor(l/i)-this.buffer,h=c-l/i,p=h*this.tileSize.h,d=t.lat-i*c;return{tilelon:r,tilelat:i,tileoffsetlon:f,tileoffsetlat:d,tileoffsetx:a,tileoffsety:p}},CLASS_NAME:"OpenLayers.Layer.MapGuide"});