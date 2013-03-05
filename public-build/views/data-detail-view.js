define(["jquery","underscore","backbone","config","utils","text!templates/data-detail.html","views/panel-view-base"],function(e,t,n,r,i,s,o){var u=o.extend({className:"panel data-detail",events:{},initialize:function(e){u.__super__.initialize.call(this,e),this.template=t.template(s)},setModel:function(e){this.model&&this.stopListening(this.model),this.model=e,this.populateFromModel(),this.listenTo(e.collection.mapLayer,"toggle:valFormatter",this.populateFromModel)},populateFromModel:function(){var t=this.model,n=this.compileDetailDataForModel(t)||{data:{},metadata:{}},r=this.$(".panel-body"),i=function(e){return e.label&&e.value!=null?'<tr><th class="value-label">'+e.label+'</th><td class="value">'+e.value+"</td></tr>":e.label?'<tr><td colspan="2" class="value-label single"><h5 class="box">'+e.label+"</h5></td></tr>":e.value!=undefined?'<tr><td colspan="2" class="value single">'+e.value+"</td></tr>":e.body!=undefined?'<tr><td colspan="2" class="body"><div class="meta box">'+e.body+"</div></td></tr>":""},s=e(".detail-data",r),o="";for(var u=0;u<n.data.length;u++)o+=i(n.data[u]);s.html(o),s.toggle(o!="");var s=e(".detail-metadata",r),o="";for(var u=0;u<n.metadata.length;u++)o+=i(n.metadata[u]);s.html(o),s.toggle(o!="")},compileDetailDataForModel:function(e){if(!e.collection)return;var t=e.collection.mapLayer,n=t.getLayerOptions(),r=t.getValFormatter(),i=e.get("val"),s=e.get("altVal"),o=e.get("label"),u=e.get("datetime"),a=e.get("count"),f=e.get("description"),f=f?typeof f=="object"?f.min:f:null,l,c;this.$(".model-title").text(t.getDisplay("title"));if(u){var h=typeof u=="object"?u.max:u,p=typeof u=="object"?u.min:u;l=h?(new Date(h)).format(n.datetimeFormat||locale.formats.DATE_SHORT):null,c=p?(new Date(p)).format(n.datetimeFormat||locale.formats.DATE_SHORT):null}var d=[];if(c)var v=c!=l?__("%(minDate)s–%(maxDate)s",{minDate:c,maxDate:l}):c;else var v="";o?d.push({label:o.min+"<br />"+v}):d.push({label:v}),t.isNumeric()&&d.push({label:r.unit,value:r.format(typeof i=="object"?i.avg:i)}),f&&f.length&&d.push({body:f});var m=t.attributes.featureCollection.reduce?[{label:__("no. of ")+(n.itemTitlePlural||"samples"),value:formatLargeNumber(a)}]:[];return a>1&&(m=m.concat([{label:__("peak",{unit:r.unit}),value:r.format(i.max)},{label:__("minimum",{unit:r.unit}),value:r.format(i.min)},{label:__("average",{unit:r.unit}),value:r.format(i.avg)}])),{data:d,metadata:m}}});return u});