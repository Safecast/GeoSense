/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Control.KeyboardDefaults=OpenLayers.Class(OpenLayers.Control,{autoActivate:!0,slideFactor:75,observeElement:null,draw:function(){var e=this.observeElement||document;this.handler=new OpenLayers.Handler.Keyboard(this,{keydown:this.defaultKeyPress},{observeElement:e})},defaultKeyPress:function(e){var t,n=!0,r=OpenLayers.Event.element(e);if(!(!r||r.tagName!="INPUT"&&r.tagName!="TEXTAREA"&&r.tagName!="SELECT"))return;switch(e.keyCode){case OpenLayers.Event.KEY_LEFT:this.map.pan(-this.slideFactor,0);break;case OpenLayers.Event.KEY_RIGHT:this.map.pan(this.slideFactor,0);break;case OpenLayers.Event.KEY_UP:this.map.pan(0,-this.slideFactor);break;case OpenLayers.Event.KEY_DOWN:this.map.pan(0,this.slideFactor);break;case 33:t=this.map.getSize(),this.map.pan(0,-0.75*t.h);break;case 34:t=this.map.getSize(),this.map.pan(0,.75*t.h);break;case 35:t=this.map.getSize(),this.map.pan(.75*t.w,0);break;case 36:t=this.map.getSize(),this.map.pan(-0.75*t.w,0);break;case 43:case 61:case 187:case 107:this.map.zoomIn();break;case 45:case 109:case 189:case 95:this.map.zoomOut();break;default:n=!1}n&&OpenLayers.Event.stop(e)},CLASS_NAME:"OpenLayers.Control.KeyboardDefaults"});