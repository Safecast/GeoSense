/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

OpenLayers.Control.Attribution=OpenLayers.Class(OpenLayers.Control,{separator:", ",template:"${layers}",destroy:function(){this.map.events.un({removelayer:this.updateAttribution,addlayer:this.updateAttribution,changelayer:this.updateAttribution,changebaselayer:this.updateAttribution,scope:this}),OpenLayers.Control.prototype.destroy.apply(this,arguments)},draw:function(){return OpenLayers.Control.prototype.draw.apply(this,arguments),this.map.events.on({changebaselayer:this.updateAttribution,changelayer:this.updateAttribution,addlayer:this.updateAttribution,removelayer:this.updateAttribution,scope:this}),this.updateAttribution(),this.div},updateAttribution:function(){var e=[];if(this.map&&this.map.layers){for(var t=0,n=this.map.layers.length;t<n;t++){var r=this.map.layers[t];r.attribution&&r.getVisibility()&&OpenLayers.Util.indexOf(e,r.attribution)===-1&&e.push(r.attribution)}this.div.innerHTML=OpenLayers.String.format(this.template,{layers:e.join(this.separator)})}},CLASS_NAME:"OpenLayers.Control.Attribution"});