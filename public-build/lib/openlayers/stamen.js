(function(e){function s(e,t,i){var s=o(e);for(var u=0;u<t.length;u++){var a=[e,t[u]].join("-");r[a]=n(a,i||s.type,s.minZoom,s.maxZoom)}}function o(e){if(e in r)return r[e];throw"No such provider ("+e+")"}var t=" a. b. c. d.".split(" "),n=function(e,n,r,s){return{url:["http://{S}tile.stamen.com/",e,"/{Z}/{X}/{Y}.",n].join(""),type:n,subdomains:t.slice(),minZoom:r,maxZoom:s,attribution:i}},r={toner:n("toner","png",0,20),terrain:n("terrain","jpg",4,18),watercolor:n("watercolor","jpg",1,16),"trees-cabs-crime":{url:"http://{S}.tiles.mapbox.com/v3/stamen.trees-cabs-crime/{Z}/{X}/{Y}.png",type:"png",subdomains:"a b c d".split(" "),minZoom:11,maxZoom:18,extent:[{lat:37.853,lon:-122.577},{lat:37.684,lon:-122.313}],attribution:['Design by Shawn Allen at <a href="http://stamen.com">Stamen</a>.','Data courtesy of <a href="http://fuf.net">FuF</a>,','<a href="http://www.yellowcabsf.com">Yellow Cab</a>','&amp; <a href="http://sf-police.org">SFPD</a>.'].join(" ")}},i=['Map tiles by <a href="http://stamen.com">Stamen Design</a>, ','under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. ','Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, ','under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'].join("");s("toner",["hybrid","labels","lines","background","lite"]),s("toner",["2010"]),s("toner",["2011","2011-lines","2011-labels","2011-lite"]),s("terrain",["background"]),s("terrain",["labels","lines"],"png"),e.stamen=e.stamen||{},e.stamen.tile=e.stamen.tile||{},e.stamen.tile.providers=r,e.stamen.tile.getProvider=o;if(typeof MM=="object"){var u=typeof MM.Template=="function"?MM.Template:MM.TemplatedMapProvider;MM.StamenTileLayer=function(e){var t=o(e);this._provider=t,MM.Layer.call(this,new u(t.url,t.subdomains)),this.provider.setZoomRange(t.minZoom,t.maxZoom),this.attribution=t.attribution},MM.StamenTileLayer.prototype={setCoordLimits:function(e){var t=this._provider;return t.extent?(e.coordLimits=[e.locationCoordinate(t.extent[0]).zoomTo(t.minZoom),e.locationCoordinate(t.extent[1]).zoomTo(t.maxZoom)],!0):!1}},MM.extend(MM.StamenTileLayer,MM.Layer)}typeof L=="object"&&(L.StamenTileLayer=L.TileLayer.extend({initialize:function(e){var t=o(e),n=t.url.replace(/({[A-Z]})/g,function(e){return e.toLowerCase()});L.TileLayer.prototype.initialize.call(this,n,{minZoom:t.minZoom,maxZoom:t.maxZoom,subdomains:t.subdomains,scheme:"xyz",attribution:t.attribution})}}));if(typeof OpenLayers=="object"){function a(e){return e.replace(/({.})/g,function(e){return"$"+e.toLowerCase()})}OpenLayers.Layer.Stamen=OpenLayers.Class(OpenLayers.Layer.OSM,{initialize:function(e,t){var n=o(e),r=n.url,i=n.subdomains,s=[];if(r.indexOf("{S}")>-1)for(var u=0;u<i.length;u++)s.push(a(r.replace("{S}",i[u])));else s.push(a(r));return t=OpenLayers.Util.extend({numZoomLevels:n.maxZoom,buffer:0,transitionEffect:"resize",tileOptions:{crossOriginKeyword:null}},t),OpenLayers.Layer.OSM.prototype.initialize.call(this,e,s,t)}})}typeof google=="object"&&typeof google.maps=="object"&&(google.maps.StamenMapType=function(e){var t=o(e),n=t.subdomains;return google.maps.ImageMapType.call(this,{getTileUrl:function(e,r){var i=1<<r,s=e.x%i,o=s<0?s+i:s,u=e.y,a=(r+o+u)%n.length;return[t.url.replace("{S}",n[a]).replace("{Z}",r).replace("{X}",o).replace("{Y}",u)]},tileSize:new google.maps.Size(256,256),name:e,minZoom:t.minZoom,maxZoom:t.maxZoom})},google.maps.StamenMapType.prototype=new google.maps.ImageMapType("_"))})(typeof exports=="undefined"?this:exports);