define(["jquery","underscore","backbone"],function(e,t,n){var r={initModelInputs:function(){var t=this;this.modelInputs={},this.$(".model-input").each(function(){var n=e(this).attr("data-name")||e(this).attr("name");t.modelInputs[n]||(t.modelInputs[n]=[]),t.modelInputs[n].push(this)}),this.customInitModelInputs&&t.customInitModelInputs()},populateModelInputs:function(){this.savedModelAttributes=t.deepClone(this.model.attributes);for(var e in this.modelInputs){var n=this.model.get(e);this.populateModelInput(e,n)}this.isChanged=!1},populateModelInput:function(t,n){var r=this;e(r.modelInputs[t]).each(function(){e(this).is(".btn-group")?e(".btn",this).each(function(){e(this).val()!=n?e(this).removeClass("active"):e(this).addClass("active")}):e(this).is("input[type=checkbox], input[type=radio]")?e(this).attr("checked",n==1):e(this).val(n)})},populateFromModel:function(){this.populateModelInputs(),this.customPopulateFromModel&&this.customPopulateFromModel()},getValueFromModelInput:function(t){var n=e(this.modelInputs[t][0]),r;return e(n).is("input[type=checkbox], input[type=radio]")?r=n.is(":checked"):r=n.val(),r},getValuesFromModelInputs:function(){var e={};for(var t in this.modelInputs)e[t]=this.getValueFromModelInput(t);return this.customGetValuesFromModelInputs&&(e=this.customGetValuesFromModelInputs(e)),e},updateModelFromInputs:function(e){var t=this.getValuesFromModelInputs();this.model.set(t,e||{})},handleValidationErrors:function(t){try{var n=e.parseJSON(t.responseText);n&&n.errors&&console.error("errors:",n.errors)}catch(r){}}};return r});