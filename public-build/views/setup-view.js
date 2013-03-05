define(["jquery","underscore","backbone","config","utils","text!templates/setup.html","views/modal-view"],function(e,t,n,r,i,s,o){var u=o.extend({tagName:"div",className:"setup-view modal fade",events:{"click #deleteMapButton":"deleteMapClicked","click #saveCloseButton":"saveClicked","click #cancelButton":"cancelClicked"},initialize:function(e){this.template=t.template(s),this.mapInfoChanged=!1,this.listenTo(this.model,"sync",this.populateFromModel)},populateFromModel:function(){var t=this,n=this.model.attributes;this.$(".map-name").html(n.title+" Setup"),this.modelFieldInputs.each(function(){e(this).removeClass("error");var t=this.name.split(".");t.length==2?n[t[0]]&&e(this).val(n[t[0]][t[1]]):e(this).val(n[this.name])}),this.$(".map-url").val(app.genPublicURL()),this.$(".map-admin-url").val(app.genAdminURL())},render:function(){var t=this;return e(this.el).html(this.template()),this.$(".map-url, .map-admin-url").click(function(){e(this).select()}),this.$(".enter-email").click(function(){return e("#tab-setup-metadata").trigger("click"),!1}),this.modelFieldInputs=this.$("#setup-metadata input, #setup-metadata textarea, #setup-custom-domain input"),this.$("#cancelButton").hide(),this.modelFieldInputs.each(function(){e(this).on("change keydown",function(){t.mapInfoChanged=!0,t.$("#cancelButton").show(),t.$("#saveCloseButton").text(__("Save and Close"))})}),e(this.el).on("hidden",function(){app.navigate(app.genMapURI(null))}),this.populateFromModel(),this},saveClicked:function(t){console.log("saveClicked",this.mapInfoChanged);if(!this.mapInfoChanged)return this.close(),!1;var n={};this.modelFieldInputs.each(function(){n[this.name]=e(this).val()});var r=this;return this.$("#saveCloseButton").attr("disabled",!0),this.model.save(n,{success:function(e,t,n){r.close(),r.$("#saveCloseButton").attr("disabled",!1),r.mapInfoChanged=!1},error:function(t,n,i){var s=e.parseJSON(n.responseText);console.error("failed to update map: "+r.model.id);if(s&&s.errors){r.modelFieldInputs.removeClass("error");for(var o in s.errors)e('[name="'+s.errors[o].path+'"]',this.modelFieldInputs).addClass("error");console.error("errors:",s.errors)}r.$("#saveCloseButton").attr("disabled",!1)}}),!1},cancelClicked:function(e){return this.populateFromModel(),this.close(),!1},deleteMapClicked:function(e){var t=this,n=this.model.id;return window.confirm(__("Are you sure you want to delete this map? This action cannot be reversed!"))&&this.model.destroy({success:function(e,t,r){console.log("deleted map: "+n),window.location="/"},error:function(e,t,r){console.error("failed to delete map: "+n,t)}}),!1}});return u});