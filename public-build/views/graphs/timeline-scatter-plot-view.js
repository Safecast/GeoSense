define(["jquery","underscore","backbone","config","utils","text!templates/scatter-plot.html","views/graphs/graph-view-base","d3"],function(e,t,n,r,i,s,o,u){var a=o.extend({className:"graph scatter-plot",events:{},initialize:function(e){var n=this,e=t.extend({renderAxes:!0},e);a.__super__.initialize.call(this,e),this.template=t.template(s)},renderGraph:function(){var e=this,t=this.model.getValFormatter();a.__super__.renderGraph.apply(this,arguments);var n=this.collection.models,r=function(e){var t=e.getDatetimeVal(),t=t.min!=undefined?t.min:t;return t!=undefined?new Date(t):null},i=function(e){var n=e.getNumericVal(),n=n.avg!=undefined?n.avg:n;return t.convert(n)},s=function(e){return __("%(unit)s: %(value)s",{value:t.format(e),unit:t.unit})},o=u.time.scale().range(this.getXRange()).domain(u.extent(n,r)),f=u.scale.linear().range(this.getYRange()).domain(u.extent(n,i));this.svg.selectAll("circle").data(n).enter().append("circle").attr("class","dot").attr("fill",function(e){return e.getRenderAttributes().color}).attr("stroke",function(e){return e.getRenderAttributes().darkerColor}).attr("cx",function(e){return o(r(e))}).attr("cy",function(e){return f(i(e))}).attr("r",function(e){return 3.5}).on("mouseover",function(t){var n=this;e.showTooltip(this,s(i(t)))});if(this.renderAxes){var l=u.svg.axis().scale(o).orient("bottom"),c=u.svg.axis().scale(f).tickFormat(function(e,t){return autoFormatNumber(e)}).orient("left");this.appendXAxis(l),this.appendYAxis(c,t.unit)}return this}});return a});