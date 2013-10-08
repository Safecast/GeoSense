define(["jquery","underscore","backbone","config","utils","text!templates/graphs-panel.html","views/panel-view-base","mixins/timeout-queue-mixin"],function(e,t,n,r,i,s,o,u){var a=o.extend({className:"panel panel-default panel-anchor-bottom graphs",draggable:!1,events:{"click .graph-toggles button":"toggleGraphViewClicked"},initialize:function(e){a.__super__.initialize.call(this,e);var n=this;this.template=t.template(s),this.createTimeoutQueue("redraw",250),this.graphViews={},this.graphView,this.on("panel:resize",this.adjustAndRedrawGraphs),this.on("panel:show",this.adjustAndRedrawGraphs),this.listenTo(this.model,"change",this.modelChanged),this.listenTo(this.model,"toggle:valFormatter",function(){n.adjustAndRedrawGraphs()})},adjustAndRedrawGraphs:function(){var e=this;this.queueTimeout("redraw",function(){t.each(e.graphViews,function(e,t){e.fillExtents()}),e.graphView&&e.$el.is(":visible")&&(e.graphView.graphRendered?e.graphView.redrawGraph():e.graphView.renderGraph())})},render:function(){return a.__super__.render.call(this),this.populateFromModel(),this.$graphToggles=this.$(".graph-toggles"),this.$graphToggleTemplate=e(".element-template",this.$graphToggles).remove().removeClass("element-template"),this},modelChanged:function(e,t){if(t.poll)return;this.adjustAndRedrawGraphs(),this.populateFromModel()},populateFromModel:function(){this.$(".model-title").text(this.model.getDisplay("title"))},addGraphView:function(e,t,n){this.graphViews[e]=t;var r=this.$graphToggleTemplate.clone().attr("data-value",e).text(n||e);this.$graphToggles.append(r),this.$(".graph-container").append(t.$el),this.graphView?t.hide():this.toggleGraphView(e)},toggleGraphViewClicked:function(t){this.toggleGraphView(e(t.currentTarget).attr("data-value")),this.updatePanelState(!0)},toggleGraphView:function(n){n&&(this.graphView=this.graphViews[n]),e("button",this.$graphToggles).each(function(){e(this).toggleClass("active",e(this).attr("data-value")==n)}),this.$el.is(":visible")&&t.each(this.graphViews,function(e,t){t==n?e.show():e.hide()})}});return t.extend(a.prototype,u),a});