/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Strategy.Save=OpenLayers.Class(OpenLayers.Strategy,{events:null,auto:!1,timer:null,initialize:function(e){OpenLayers.Strategy.prototype.initialize.apply(this,[e]),this.events=new OpenLayers.Events(this)},activate:function(){var e=OpenLayers.Strategy.prototype.activate.call(this);return e&&this.auto&&(typeof this.auto=="number"?this.timer=window.setInterval(OpenLayers.Function.bind(this.save,this),this.auto*1e3):this.layer.events.on({featureadded:this.triggerSave,afterfeaturemodified:this.triggerSave,scope:this})),e},deactivate:function(){var e=OpenLayers.Strategy.prototype.deactivate.call(this);return e&&this.auto&&(typeof this.auto=="number"?window.clearInterval(this.timer):this.layer.events.un({featureadded:this.triggerSave,afterfeaturemodified:this.triggerSave,scope:this})),e},triggerSave:function(e){var t=e.feature;(t.state===OpenLayers.State.INSERT||t.state===OpenLayers.State.UPDATE||t.state===OpenLayers.State.DELETE)&&this.save([e.feature])},save:function(e){e||(e=this.layer.features),this.events.triggerEvent("start",{features:e});var t=this.layer.projection,n=this.layer.map.getProjectionObject();if(!n.equals(t)){var r=e.length,i=new Array(r),s,o;for(var u=0;u<r;++u)s=e[u],o=s.clone(),o.fid=s.fid,o.state=s.state,s.url&&(o.url=s.url),o._original=s,o.geometry.transform(n,t),i[u]=o;e=i}this.layer.protocol.commit(e,{callback:this.onCommit,scope:this})},onCommit:function(e){var t={response:e};if(e.success()){var n=e.reqFeatures,r,i,s=[],o=e.insertIds||[],u=0;for(var a=0,f=n.length;a<f;++a)i=n[a],i=i._original||i,r=i.state,r&&(r==OpenLayers.State.DELETE?s.push(i):r==OpenLayers.State.INSERT&&(i.fid=o[u],++u),i.state=null);s.length>0&&this.layer.destroyFeatures(s),this.events.triggerEvent("success",t)}else this.events.triggerEvent("fail",t)},CLASS_NAME:"OpenLayers.Strategy.Save"});