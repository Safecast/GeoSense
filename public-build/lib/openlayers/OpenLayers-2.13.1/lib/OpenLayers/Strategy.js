/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Strategy=OpenLayers.Class({layer:null,options:null,active:null,autoActivate:!0,autoDestroy:!0,initialize:function(e){OpenLayers.Util.extend(this,e),this.options=e,this.active=!1},destroy:function(){this.deactivate(),this.layer=null,this.options=null},setLayer:function(e){this.layer=e},activate:function(){return this.active?!1:(this.active=!0,!0)},deactivate:function(){return this.active?(this.active=!1,!0):!1},CLASS_NAME:"OpenLayers.Strategy"});