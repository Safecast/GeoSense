/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Handler=OpenLayers.Class({id:null,control:null,map:null,keyMask:null,active:!1,evt:null,initialize:function(e,t,n){OpenLayers.Util.extend(this,n),this.control=e,this.callbacks=t;var r=this.map||e.map;r&&this.setMap(r),this.id=OpenLayers.Util.createUniqueID(this.CLASS_NAME+"_")},setMap:function(e){this.map=e},checkModifiers:function(e){if(this.keyMask==null)return!0;var t=(e.shiftKey?OpenLayers.Handler.MOD_SHIFT:0)|(e.ctrlKey?OpenLayers.Handler.MOD_CTRL:0)|(e.altKey?OpenLayers.Handler.MOD_ALT:0);return t==this.keyMask},activate:function(){if(this.active)return!1;var e=OpenLayers.Events.prototype.BROWSER_EVENTS;for(var t=0,n=e.length;t<n;t++)this[e[t]]&&this.register(e[t],this[e[t]]);return this.active=!0,!0},deactivate:function(){if(!this.active)return!1;var e=OpenLayers.Events.prototype.BROWSER_EVENTS;for(var t=0,n=e.length;t<n;t++)this[e[t]]&&this.unregister(e[t],this[e[t]]);return this.active=!1,!0},callback:function(e,t){e&&this.callbacks[e]&&this.callbacks[e].apply(this.control,t)},register:function(e,t){this.map.events.registerPriority(e,this,t),this.map.events.registerPriority(e,this,this.setEvent)},unregister:function(e,t){this.map.events.unregister(e,this,t),this.map.events.unregister(e,this,this.setEvent)},setEvent:function(e){return this.evt=e,!0},destroy:function(){this.deactivate(),this.control=this.map=null},CLASS_NAME:"OpenLayers.Handler"}),OpenLayers.Handler.MOD_NONE=0,OpenLayers.Handler.MOD_SHIFT=1,OpenLayers.Handler.MOD_CTRL=2,OpenLayers.Handler.MOD_ALT=4;