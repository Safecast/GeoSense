define(["jquery","underscore","backbone","config","utils","text!templates/map-layer-editor.html","views/panel-view-base","mixins/model-editor-mixin","mixins/editor-widgets-mixin","lib/color-gradient/color-gradient"],function(e,t,n,r,i,s,o,u,a,f){var l=o.extend({className:"panel panel-default map-layer-editor",events:{"click .btn.save":"saveButtonClicked","click .btn.undo":"undoButtonClicked","click .btn.destroy":"destroyButtonClicked","click .btn.feature-type":"featureTypeClicked","change .model-input.layer-toggle":"layerToggled","change .model-input, .color-palette input, .color-palette select":"modelInputChanged","click .show-preview":"previewChanged","click .show-advanced":"showAdvancedChanged","click .generate-colors":"generateColorsClicked","click .import-export":"importExportClicked","click .import-settings":"importSettingsClicked","change textarea[name=settings-json]":"importSettingsChanged","click textarea[name=settings-json]":function(t){return e(t.currentTarget).select(),!1},"click .hide-color-generator":"hideColorGenerator","click .remove-color":"removeColorClicked","click .add-color":"addColorClicked","click .color-schemes .color-scheme a":"toggleColorScheme","click .add-color-scheme a":"addColorScheme","click .delete-color-scheme a":"deleteColorScheme","change .color-scheme-name":"colorSchemeNameChanged","keydown input[type=text]":function(t){if(t.which==13)return e(t.currentTarget).select(),e(t.currentTarget).trigger("change"),!1}},initialize:function(e){l.__super__.initialize.call(this,e),this.template=t.template(s),this.listenTo(this.model,"change",this.updateFromModel),this.listenTo(this.model,"sync",this.modelSynced),this.listenTo(this.model,"destroy",this.remove),this.colorSchemeIndex=this.model.getLayerOptions().colorSchemeIndex||0},modelSynced:function(e,t,n){if(n.poll)return;this.model.hasChanged("layerOptions")&&this.populateFromModel()},render:function(){var t=this,n=this.model.attributes.featureCollection;return l.__super__.render.call(this),this.colorRowTemplate=this.$(".color-palette tr.element-template").remove().clone().removeClass("element-template"),this.initModelInputs(),this.$(".dropdown-toggle").dropdown(),this.$(".has-popover").each(function(){var n=e(this),r=n.attr("data-content-selector");if(r){var i=t.$(r).remove();e(this).popover({content:i,html:!0}),e(this).on("shown",function(e,t){n.addClass("active")}),e(this).on("hidden",function(e,t){n.removeClass("active")}),n.click(function(e){e.preventDefault()})}else e(this).popover({})}),this.$(".hint-toggle").each(function(){var n=t.$(".hint."+e(this).attr("data-target")).remove();e("a",n).click(function(){return window.open(e(this).attr("href")),!1}),e(this).popover({content:n,html:!0,placement:e(this).attr("data-placement")||"right"}),e(this).click(function(){return!1})}),this.initSliders(),this.populateFromModel(),this.initColorPicker(this.$(".model-input.color-picker")),this.$(".color-palette tbody tr").addClass("drag-handle"),this.$(".color-palette tbody").sortable({stop:function(e,n){t.modelInputChanged(e)}}),this.initColorPicker(this.$(".model-input.color-picker")),this.$(".has-tooltip").tooltip({delay:0,container:"body"}),this.$(".show-preview").addClass("active"),this},updateFromModel:function(){this.$(".model-title").text(this.model.getDisplay("title")),this.$(".model-numeric").toggle(this.model.isNumeric())},customInitModelInputs:function(){var n=this,r=this.model.getFeatureCollectionAttr("fields",[]);this.$("select.field-names").each(function(){var n=e(this).attr("data-type"),i=['<option value="">('+__("none")+")</option>"];t.each(r,function(e){e.name.match(/^properties\./)&&(!n||n==e.type)&&i.push('<option value="%(name)s">%(label)s</option>'.format(e))}),e(this).html(i.join("\n"))})},customPopulateFromModel:function(){this.updateFromModel(),this.$(".panel-header .title").text(this.model.get("layerOptions.title")),this.populateColorSchemes(),this.setButtonState(!1,!1),this.updateSliders()},customGetValuesFromModelInputs:function(e){var n=this,r=t.deepClone(this.model.get("layerOptions.colorSchemes"))||[{}];return r[this.colorSchemeIndex].colors=this.getColorsFromTable(),e["layerOptions.colorSchemes"]=r,e["layerOptions.colorSchemeIndex"]=this.colorSchemeIndex,e},undoButtonClicked:function(e){return this.colorSchemeIndex=this.savedModelAttributes.layerOptions.colorSchemeIndex||0,this.model.setColorScheme(this.colorSchemeIndex),this.model.set(this.savedModelAttributes),this.populateFromModel(),!1},saveButtonClicked:function(e){var t=this;return this.isChanged?(this.setButtonState(!1),this.updateModelFromInputs(),this.model.save({},{success:function(e,t,n){},error:function(e,n,r){t.setButtonState(!0),t.handleValidationErrors(n)}}),!1):!1},destroyButtonClicked:function(e){var t=this;return window.confirm(__("Are you sure you want to delete this layer? This action cannot be reversed!"))&&this.model.destroy({success:function(e,t,n){},error:function(e,t,n){}}),!1},featureTypeClicked:function(t){return this.populateModelInput("layerOptions.featureType",e(t.currentTarget).val()),this.modelInputChanged(t),!1},modelInputChanged:function(e){this.isChanged=!0,this.updateModel()},updateModel:function(){this.setButtonState(this.isChanged,!1),this.isPreviewEnabled()&&this.model.setColorScheme(this.colorSchemeIndex),this.updateModelFromInputs({silent:!this.isPreviewEnabled()})},previewChanged:function(e){return this.$(".show-preview").toggleClass("active"),this.isPreviewEnabled()&&this.updateModel(),!1},showAdvancedChanged:function(e){return this.$(".show-advanced").toggleClass("active"),this.setButtonState(null,!0),!1},isPreviewEnabled:function(){return this.$(".show-preview").is(".active")},hideColorGenerator:function(e){return this.$(".show-color-generator").popover("hide"),!1},setButtonState:function(t,n){t!=undefined&&(this.$(".btn.undo").attr("disabled",!t),this.$(".btn.save").attr("disabled",!t)),this.$(".remove-color").attr("disabled",this.$(".color-palette tbody tr").length<2),this.$(".color-palette tbody tr").length<=2?this.$(".show-color-generator").attr("disabled",!1):this.$(".show-color-generator").attr("disabled",!0),this.hideColorGenerator();var r=n?"fast":null,i=this.$(".show-advanced").is(".active");this.$(".advanced").each(function(){e(this).hasClass("feature-settings")||(i?e(this).show(r):e(this).hide(r))});var s=this.getValueFromModelInput("layerOptions.featureType");this.$(".feature-settings").each(function(){var t=e(this).hasClass(s)&&(i||!e(this).hasClass("advanced"));t?e(this).show(r):e(this).hide(r)})},addColorRow:function(t){var t=t||{},n=this.colorRowTemplate.clone();return n.attr("data-id",t._id),e("[name=position]",n).val(t.position||DEFAULT_COLOR_EDITOR_POSITION),this.initColorPicker(e(".color-picker",n),t.color||DEFAULT_COLOR_EDITOR_COLOR),e("[name=interpolation] option",n).each(function(){e(this).attr("selected",e(this).val()==t.interpolation||t.interpolation==""&&e(this).val()==f.prototype.interpolation.default)}),this.$(".color-palette tbody").append(n),n},populateColorSchemes:function(e){var n=this,r=this.model.get("layerOptions.colorSchemes");this.$(".color-schemes .dropdown-menu .color-scheme").remove();var i=[];t.map(r,function(e,t){i.push('<li class="color-scheme"><a class="toggle-color-scheme" data-index="'+t+'" href="#">'+e.name+"</a></li>")}),this.$(".color-schemes .dropdown-menu").append(i.join("\n")),(e||e==undefined)&&this.toggleColorScheme(),this.$(".delete-color-scheme").toggle(r!=undefined&&r.length>1),this.$(".color-scheme").toggle(r!=undefined&&r.length>0)},addColorScheme:function(e){e.preventDefault();var t=this,n=this.model.get("layerOptions.colorSchemes"),r={name:__("color scheme %(i)s",{i:n?n.length+1:1}),colors:[{color:DEFAULT_COLOR_EDITOR_COLOR,position:DEFAULT_COLOR_EDITOR_POSITION}]};n?n.push(r):(n=[r],this.model.set({"layerOptions.colorSchemes":n},{silent:!0})),this.colorSchemeIndex=n.length-1,this.populateColorSchemes(),this.modelInputChanged(),this.$(".color-scheme-name").select().focus()},deleteColorScheme:function(){event.preventDefault();var e=this,t=this.model.get("layerOptions.colorSchemes");if(t.length<2)return;t.splice(this.colorSchemeIndex,1),this.colorSchemeIndex=0,this.populateColorSchemes(),this.modelInputChanged()},colorSchemeNameChanged:function(t){var n=e(t.currentTarget),r=this.getCurrentColorScheme();n.val()==""?n.val(r.name):(r.name=n.val(),this.modelInputChanged(),this.populateColorSchemes(!1))},getCurrentColorScheme:function(){return this.model.get("layerOptions.colorSchemes")[this.colorSchemeIndex]},populateColorTable:function(e){var t=this;this.$(".color-palette tbody").empty();var e=e||this.getCurrentColorScheme().colors;for(var n=0;n<e.length;n++)var r=this.addColorRow(e[n])},toggleColorScheme:function(t){var n=this,r=this.model.get("layerOptions.colorSchemes");t&&(this.getCurrentColorScheme().colors=this.getColorsFromTable(),this.colorSchemeIndex=e(t.currentTarget).attr("data-index"),t.preventDefault());var i=this.model.getColorScheme(this.colorSchemeIndex),s=this.$(".color-schemes .dropdown-menu .color-scheme");s.removeClass("active"),e(s[this.colorSchemeIndex]).addClass("active"),this.$(".color-scheme-name").val(i.name),this.populateColorTable(i.colors),this.setButtonState(),t&&this.modelInputChanged()},getColorsFromTable:function(){var t=[];return this.$(".color-palette tbody tr").each(function(){if(e(this).is(".element-template"))return;var n={_id:e(this).attr("data-id"),color:e(".color-picker",this).val(),position:e("[name=position]",this).val(),interpolation:e("[name=interpolation]",this).val()};n._id.length||delete n._id,t.push(n)}),t},removeColorClicked:function(t){return e(t.currentTarget).attr("disabled")?!1:(e(t.currentTarget).closest("tr").remove(),this.modelInputChanged(),!1)},addColorClicked:function(e){return this.addColorRow(),this.modelInputChanged(),!1},importExportClicked:function(e){var n=t.extend({},this.model.getLayerOptions());for(var r in n)r[0]=="_"&&delete n[r];this.$("textarea[name=settings-json]").val(JSON.stringify(n)),this.$(".import-settings").attr("disabled",!0)},importSettingsChanged:function(e){try{var t=JSON.parse(this.$("textarea[name=settings-json]").val())}catch(n){}self.$(".import-settings").attr("disabled",!t)},importSettingsClicked:function(e){this.$(".import-export").popover("hide");var n=t.deepClone(this.model.attributes);this.model.setLayerOptions(JSON.parse(this.$("textarea[name=settings-json]").val())),this.populateFromModel(),this.setButtonState(!0,!1),this.isChanged=!0,this.savedModelAttributes=n},generateColorsClicked:function(t){var n=e("input[name=colorSchemeType]:checked").val(),r=parseInt(e("input[name=colorSchemeSteps]").val()),i=this.getColorsFromTable();this.$(".show-color-generator").popover("hide");if(r&&!isNaN(r)){var s=getRGBChannels(i[0].color),o=rgb2hsb(s),u=o[0],a=o[1],f=o[2],l=Math.min(.3,f),c=1,h=0,p=.3,d=.1,v=.75,m;switch(n){case"sequential":m=i.length>1?rgb2hsb(getRGBChannels(i[i.length-1].color)):[u,a,f<v?c:l];break;case"qualitative":case"diverging":m=i.length>1?rgb2hsb(getRGBChannels(i[i.length-1].color)):[(u+180)%360,a,f]}var g=m[0],y=m[1],b=m[2],w=hsb2rgb(m),E=function(e,t,n){return t+(n-t)*e},S=[],x=r>1?1/(r-1):0;for(var T=0;T<r;T++){var N=x*T,C=1-Math.abs(.5-N)/.5,k;switch(n){case"qualitative":var L=N+(T?T%2?x:-x:0),A=[(u+(g-u)*L)%360,E(N,a,y),E(N,f,b)];k=hsb2rgb(A);break;case"sequential":k=[E(N,s[0],w[0]),E(N,s[1],w[1]),E(N,s[2],w[2])];break;case"diverging":k=[E(N,s[0],w[0]),E(N,s[1],w[1]),E(N,s[2],w[2])];var A=rgb2hsb(k);A[2]=E(N,f,b),A[2]=Math.min(c,A[2]*(1+C*d)),A[1]=Math.max(h,A[1]-C*p),k=hsb2rgb(A)}var O=intToColor(rgb2int(k));S.push({color:O,position:Math.round(N*100)+"%",interpolation:"threshold"})}for(var T=0;T<S.length;T++)this.addColorRow(S[T]);this.populateColorTable(S),this.modelInputChanged()}return!1},layerToggled:function(t){this.model.toggleEnabled(e(t.currentTarget).is(":checked"))}});return t.extend(l.prototype,u),t.extend(l.prototype,a),l});