define(["jquery","underscore","backbone","config","utils","text!templates/modal.html"],function(e,t,n,r,i,s){var o=n.View.extend({tagName:"div",className:"modal fade",events:{},initialize:function(e){this.template||(this.template=t.template(s)),this.modalOptions=t.extend({keyboard:!0,show:!1},e?e.modalOptions:{})},render:function(){return this.$el.html(this.template()).attr("tabindex",-1).modal(this.modalOptions),this},setTitle:function(e){this.$(".modal-title").html(e)},setBody:function(e){this.$(".modal-body").html(e)},show:function(){var t=this;e(this.el).modal("show"),e(this.el).on("hidden",function(){t.remove()})},close:function(){e(this.el).modal("hide")}});return o});