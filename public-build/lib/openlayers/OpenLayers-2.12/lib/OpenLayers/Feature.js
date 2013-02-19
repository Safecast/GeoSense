/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Feature=OpenLayers.Class({layer:null,id:null,lonlat:null,data:null,marker:null,popupClass:null,popup:null,initialize:function(e,t,n){this.layer=e,this.lonlat=t,this.data=n!=null?n:{},this.id=OpenLayers.Util.createUniqueID(this.CLASS_NAME+"_")},destroy:function(){this.layer!=null&&this.layer.map!=null&&this.popup!=null&&this.layer.map.removePopup(this.popup),this.layer!=null&&this.marker!=null&&this.layer.removeMarker(this.marker),this.layer=null,this.id=null,this.lonlat=null,this.data=null,this.marker!=null&&(this.destroyMarker(this.marker),this.marker=null),this.popup!=null&&(this.destroyPopup(this.popup),this.popup=null)},onScreen:function(){var e=!1;if(this.layer!=null&&this.layer.map!=null){var t=this.layer.map.getExtent();e=t.containsLonLat(this.lonlat)}return e},createMarker:function(){return this.lonlat!=null&&(this.marker=new OpenLayers.Marker(this.lonlat,this.data.icon)),this.marker},destroyMarker:function(){this.marker.destroy()},createPopup:function(e){if(this.lonlat!=null){if(!this.popup){var t=this.marker?this.marker.icon:null,n=this.popupClass?this.popupClass:OpenLayers.Popup.Anchored;this.popup=new n(this.id+"_popup",this.lonlat,this.data.popupSize,this.data.popupContentHTML,t,e)}this.data.overflow!=null&&(this.popup.contentDiv.style.overflow=this.data.overflow),this.popup.feature=this}return this.popup},destroyPopup:function(){this.popup&&(this.popup.feature=null,this.popup.destroy(),this.popup=null)},CLASS_NAME:"OpenLayers.Feature"});