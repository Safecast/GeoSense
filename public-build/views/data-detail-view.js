define(["jquery","underscore","backbone","config","utils","text!templates/data-detail.html","views/panel-view-base"],function(e,t,n,r,i,s,o){var u=o.extend({className:"panel data-detail",events:{},initialize:function(e){this.template=t.template(s),this.vent=e.vent,t.bindAll(this,"toggleValFormatter"),this.vent.bind("toggleValFormatter",this.toggleValFormatter),this.visibleDetailModels={}},compileDetailDataForModel:function(e,t){var n=app.getMapLayerDeprecated(e),r=n.pointCollection,i=t.get("val"),s=i&&i.avg!=null,o=t.get("altVal"),u=t.get("label"),a=t.get("datetime"),f=t.get("count"),l=s?a.max:a,c=s?a.min:a,h=l?(new Date(l)).format(n.options.datetimeFormat||locale.formats.DATE_SHORT):null,p=c?(new Date(c)).format(n.options.datetimeFormat||locale.formats.DATE_SHORT):null,d=n.sessionOptions.valFormatter,v=[];if(p)var m=p!=h?__("%(minDate)s–%(maxDate)s",{minDate:p,maxDate:h}):p;else var m="";u?v.push({label:u.min+"<br />"+m}):v.push({label:m}),v.push({label:d.unit,value:d.format(s?i.avg:i)});var g=r.reduce?[{label:__("no. of ")+(n.options.itemTitlePlural||"samples"),value:formatLargeNumber(f)}]:[];return f>1&&(g=g.concat([{label:__("peak",{unit:r.unit}),value:d.format(i.max)},{label:__("minimum",{unit:r.unit}),value:d.format(i.min)},{label:__("average",{unit:r.unit}),value:d.format(i.avg)}])),{data:v,metadata:g}},showDetailData:function(t,n,r){r=r||r==undefined,this.visibleDetailModels[t]=n;var i=this.compileDetailDataForModel(t,n),s=this.$(".panel-body"),o=function(e){return e.label&&e.value!=null?'<tr><th class="value-label">'+e.label+'</th><td class="value">'+e.value+"</td></tr>":e.label?'<tr><td colspan="2" class="value-label single"><h5 class="box">'+e.label+"</h5></td></tr>":e.value!=undefined?'<tr><td colspan="2" class="value single">'+e.value+"</td></tr>":""},u=e(".detail-data",s),a="";for(var f=0;f<i.data.length;f++)a+=o(i.data[f]);u.html(a),a!=""?u.show():u.hide();var u=e(".detail-metadata",s),a="";for(var f=0;f<i.metadata.length;f++)a+=o(i.metadata[f]);u.html(a),a!=""?u.show():u.hide();if(r){this.setPanelState(!0);var l=e(".collapse",s);e(".detail",l).show(),!l.is(".in"),this.$(".data-body .collapse").each(function(){this!=l[0]})}},hideDetailData:function(t){this.visibleDetailModels[t]=null;var n=this.$(".panel-body"),r=e(".collapse",n);e(".detail",r).hide()},toggleValFormatter:function(e,t){var n=e.pointCollection._id;this.visibleDetailModels[n]&&this.showDetailData(n,this.visibleDetailModels[n],!1)}});return u});