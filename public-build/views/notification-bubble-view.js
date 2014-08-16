define(["jquery","underscore","backbone","config","text!templates/notification-bubble.html"],function(e,t,n,r,i){var s=["success","info","warn","error"],o=n.View.extend({events:{},levels:s,className:"notification-bubble",initialize:function(e){this.template=t.template(i)},render:function(){return e(this.el).html(this.template()),this},setLevel:function(e){var n=this;return t.each(this.levels,function(t){n.$el.toggleClass(t,e==t)}),this},setMessage:function(e){return this.$(".message").text(e),this},appear:function(e){var t=this;return this.$el.hide().fadeIn("fast",function(){(e||e==undefined)&&setTimeout(function(){t.disappear()},NOTIFICATION_VISIBLE_TIME)}),this},disappear:function(e){var t=this;return this.$el.fadeOut("fast",function(){(e||e==undefined)&&t.destroy()}),this},destroy:function(){this.remove(),this.unbind()},notify:function(t,n){this.render().setLevel(n).setMessage(t),e("body").append(this.appear().$el)}});return t.each(s,function(e){o[e]=function(t){(new o).notify(t,e)}}),o});