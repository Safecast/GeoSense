define(["jquery","underscore","backbone","config","utils","text!templates/histogram.html","views/graphs/graph-view-base","d3"],function(e,t,n,r,i,s,o,u){var a=o.extend({className:"graph histogram",scopes:[GraphScope.OVERALL],events:{},initialize:function(e){var n=this,e=t.extend({renderAxes:!0},e);a.__super__.initialize.call(this,e),this.template=t.template(s)},renderGraph:function(){var e=this,t=this.model.getValFormatter();a.__super__.renderGraph.apply(this,arguments);var n=this.collection.properties.numBins,r=this.collection.properties.binSize,i=this.collection.models,s=t.unit||(this.model.getNumericField()||"").split(".").pop(),o=this.model.getDisplay("itemTitlePlural"),f=this.model.getMappedExtremes(),l=function(e){return e.attributes.count||0},c=function(e){var t=e.getNumericVal();return t=t.avg?t.avg:t,t},h=u.extent(i,l),p=h[0]/h[1]<1e-4?"log":"linear",d=u.scale.linear().range(this.getXRange()).domain([f.numeric.min,f.numeric.max]),v=u.scale[p]().range(this.getYRange()).domain(u.extent(i,l)),m=this.graphWidth/n;if(this.renderAxes){var g=u.svg.axis().scale(d).orient("bottom").tickFormat(function(e){return t.format(e)}),y=u.svg.axis().scale(v).orient("left");this.appendXAxis(g,s),this.appendYAxis(y,o)}return this.svg.selectAll("rect").data(i).enter().append("rect").attr("x",function(e,t){return d(c(e))}).attr("y",function(e,t){return v(l(e))}).attr("height",function(t,n){return e.graphHeight-v(l(t))}).attr("width",m).attr("class","crisp").style("fill",function(e,t){return e.getRenderAttr("color")}).on("mouseover",function(n){var i=this,s=l(n),o=c(n),a=o+r;e.showTooltip(this,__("%(count)s %(title)s between %(min)s–%(max)s",{count:autoFormatNumber(s),title:s!=1?e.model.getDisplay("itemTitlePlural"):e.model.getDisplay("itemTitle"),min:t.format(o),max:t.format(a)})),u.select(this).style("fill",n.getRenderAttr("hightlightColor",function(){return highlightForColor(n.getRenderAttr("color"))}))}).on("mouseout",function(e){u.select(this).style("fill",e.getRenderAttr("color"))}),this}});return a});