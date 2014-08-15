define(["jquery","underscore","backbone","config","utils","permissions","models/map","collections/maps","mixins/spinner-mixin","moment","locale"],function(e,t,n,r,i,s,o,u,a,f,l){var c=n.View.extend({tagName:"div",className:"object-list",events:{},render:function(){return this.$el.html(this.template()),this.$objects=this.$(".objects"),this.initLargeSpinner(this.$el),this},fetchMaps:function(){var e=this;return this.showSpinner(),(new u).forType(this.mapType).fetch({success:function(t,n,r){e.hideSpinner(),t.each(function(t,n){var r=e.createSubView({model:t,index:n,templateHtml:e.itemTemplateHtml});e.appendSubView(r),r.render()}),e.$(".objects-container").toggleClass("hidden",t.length==0),e.$(".no-objects").toggleClass("hidden",t.length>0)},error:function(t,n,r){e.hideSpinner(),console.error("failed to fetch feature maps")}}),this},createSubView:function(){console.error("createSubview is not implemented")},appendSubView:function(e,t){return this.$objects.append(e.el),e.setSuperView&&e.setSuperView(this),e}});return t.extend(c.prototype,a),c});