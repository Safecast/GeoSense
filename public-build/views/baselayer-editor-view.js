define(["jquery","underscore","backbone","config","utils","text!templates/baselayer-editor.html","views/panel-view-base","mixins/model-editor-mixin","mixins/editor-widgets-mixin"],function(e,t,n,r,i,s,o,u,a){var f=o.extend({className:"panel panel-default baselayer-editor",events:{"change .model-input":"modelInputChanged"},initialize:function(e){f.__super__.initialize.call(this,e),this.template=t.template(s)},render:function(){var e=this,t=this.model.attributes.featureCollection;return f.__super__.render.call(this),this.initModelInputs(),this.populateFromModel(),this.initSliders(),this.initColorPicker(this.$(".model-input.color-picker")),this},customPopulateFromModel:function(){var e=this.$('.model-input[name="viewOptions.baselayerOpacity"]');e.val()==""&&e.val("1")},modelInputChanged:function(e){app.setViewOptions(expandObj(this.getValuesFromModelInputs()).viewOptions)}});return t.extend(f.prototype,u),t.extend(f.prototype,a),f});