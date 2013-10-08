/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Control.Zoom=OpenLayers.Class(OpenLayers.Control,{zoomInText:"+",zoomInId:"olZoomInLink",zoomOutText:"−",zoomOutId:"olZoomOutLink",draw:function(){var e=OpenLayers.Control.prototype.draw.apply(this),t=this.getOrCreateLinks(e),n=t.zoomIn,r=t.zoomOut,i=this.map.events;return r.parentNode!==e&&(i=this.events,i.attachToElement(r.parentNode)),i.register("buttonclick",this,this.onZoomClick),this.zoomInLink=n,this.zoomOutLink=r,e},getOrCreateLinks:function(e){var t=document.getElementById(this.zoomInId),n=document.getElementById(this.zoomOutId);return t||(t=document.createElement("a"),t.href="#zoomIn",t.appendChild(document.createTextNode(this.zoomInText)),t.className="olControlZoomIn",e.appendChild(t)),OpenLayers.Element.addClass(t,"olButton"),n||(n=document.createElement("a"),n.href="#zoomOut",n.appendChild(document.createTextNode(this.zoomOutText)),n.className="olControlZoomOut",e.appendChild(n)),OpenLayers.Element.addClass(n,"olButton"),{zoomIn:t,zoomOut:n}},onZoomClick:function(e){var t=e.buttonElement;t===this.zoomInLink?this.map.zoomIn():t===this.zoomOutLink&&this.map.zoomOut()},destroy:function(){this.map&&this.map.events.unregister("buttonclick",this,this.onZoomClick),delete this.zoomInLink,delete this.zoomOutLink,OpenLayers.Control.prototype.destroy.apply(this)},CLASS_NAME:"OpenLayers.Control.Zoom"});