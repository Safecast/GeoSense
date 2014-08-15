define(["jquery","underscore","backbone"],function(e,t,n){var r={getInPlaceTextElement:function(e){return e.attr("data-text")?e.find(e.attr("data-text")):e},toggleInPlaceEditMode:function(){this.__inPlaceEditMode?(this.__preventInPlaceEditMode=!0,this.exitInPlaceEditMode(),this.__preventInPlaceEditMode=!1):this.enterInPlaceEditMode()},enterInPlaceEditMode:function(){var n=this;this.__inPlaceEditMode=!0,this.trigger("inplace:enter"),this.editableElements=this.$(".model-editable"),this.editableElements.each(function(){var r=e(this);if(r.data("replacedWith"))return;var i=e('<input class="in-place-input" type="text" name="'+e(this).attr("data-name")+'">');i.val(n.getInPlaceTextElement(r).text()),i.width(r.outerWidth()+20).height(r.outerHeight()).css({border:"none"}).addClass("edit-in-place"),t.each(["display","font-size","font-family","font-weight","line-height","color","padding","margin","min-height","max-height"],function(e){i.css(e,r.css(e))}),i.on("change",function(e){n.inPlaceInputChanged(r,i)}),i.on("keyup",function(e){switch(e.keyCode){case 13:n.inPlaceInputChanged(r,i),e.stopPropagation();break;case 27:n.exitInPlaceEditMode(),e.stopPropagation()}}),r.replaceWith(i),r.data("replacedWith",i)}),this.editableElements.length&&e(this.editableElements[0]).data("replacedWith").focus()},inPlaceInputChanged:function(e,t){var n=t.attr("name");if(n){var r={},i=t.val();r[n]=i,this.trigger("inplace:changed",r),this.getInPlaceTextElement(e).text(i)}this.__preventInPlaceEditMode||this.exitInPlaceEditMode()},exitInPlaceEditMode:function(){this.__inPlaceEditMode=!1,this.trigger("inplace:exit"),this.editableElements.each(function(){var t=e(this);if(!t.data("replacedWith"))return;e(t.data("replacedWith")).replaceWith(this),t.data("replacedWith",null)})}};return r});