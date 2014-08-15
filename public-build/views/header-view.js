define(["jquery","underscore","backbone","config","utils","permissions","text!templates/header.html"],function(e,t,n,r,i,s,o){var u=n.View.extend({tagName:"div",className:"header-view",events:{"click #aboutMap":"aboutMapClicked","click #aboutGeoSense":"aboutGeoSenseClicked","click #shareLink":"shareLinkClicked","click #postFacebook":"postFacebookClicked","click #postTwitter":"postTwitterClicked","click .map-tool.setup":"setupButtonClicked","click .map-tool.data-library":"dataLibraryButtonClicked","click .map-tool.data-import":"dataImportButtonClicked","click .map-tool.timeline":"timelineButtonClicked","click #mapView a":"mapViewToggleClicked","click #viewBase .dropdown-menu a":"viewBaseToggleClicked","click .view-style a":"viewStyleToggleClicked","click #customizeViewOptions":"customizeViewOptionsClicked","click .search-form button":"searchClicked","click .map-title":"mapTitleClicked","click .user-signup":"userSignupClicked","click .user-login":"userLoginClicked","click .user-logout":"userLogoutClicked"},initialize:function(e){this.template=t.template(o),this.listenTo(this.model,"sync",this.populateFromModel),this.listenTo(app,"user:login",this.populateFromModel),this.listenTo(app,"user:logout",this.populateFromModel)},render:function(){return e(this.el).html(this.template({config:{BASE_URL:BASE_URL}})),this.populateFromModel(),this.$(".search-query").click(function(){e(this).select()}),app.isMapAdmin()||this.$(".admin-tool").remove(),this.updateUser(),this.$(".nav").each(function(){e("li, button",this).length==0&&e(this).remove()}),this},updateUser:function(){var e=s.currentUser();e?(this.$(".user-name").text(e.email),this.$(".logged-out").addClass("hidden"),this.$(".logged-in").removeClass("hidden")):(this.$(".logged-in").addClass("hidden"),this.$(".logged-out").removeClass("hidden"))},searchClicked:function(e){var t=this.$(".search-query").val();return t!=""&&app.zoomToAddress(t),!1},mapTitleClicked:function(e){return app.resetMap(),!1},populateFromModel:function(){var e=this.$(".app-title"),t=this.model.attributes,n=this.$(".map-title"),r=app.isMapAdmin()?app.map.adminUrl():app.map.publicUrl();e.attr("href",BASE_URL),n.text(t.title),n.attr("href",r),t.linkURL?(this.$("#authorLink").show(),this.$("#authorLink a").attr("href",t.linkURL),this.$("#authorLink .text").text(t.linkTitle||t.title)):this.$("#authorLink").hide(),this.$("a.admin-map").attr("href",this.model.adminUrl()).parent().toggleClass("hidden",app.isMapAdmin()||!s.canAdminModel(this.model)&&this.model.attributes.createdBy!=undefined),this.$("a.public-map").attr("href",this.model.publicUrl()).parent().toggleClass("hidden",!app.isMapAdmin())},mapViewToggleClicked:function(e){var t=e.currentTarget,n=t.href.split("#")[1];n!=app.mapViewName&&app.navigate(app.map.publicUri({viewName:n}),{trigger:!0}),e.preventDefault()},viewBaseToggleClicked:function(e){var t=e.currentTarget,n=t.href.split("#")[1];app.setViewBase(n),e.preventDefault()},viewStyleToggleClicked:function(e){var t=e.currentTarget,n=t.href.split("#")[1];app.setViewStyle(n),e.preventDefault()},customizeViewOptionsClicked:function(e){app.showBaselayerEditor(),e.preventDefault()},timelineButtonClicked:function(e){e.preventDefault()},setupButtonClicked:function(e){app.showSetupView(),e.preventDefault()},dataImportButtonClicked:function(e){app.toggleDataImport(),e.preventDefault()},dataLibraryButtonClicked:function(e){app.toggleDataLibrary(),e.preventDefault()},aboutGeoSenseClicked:function(e){app.showAbout(),e.preventDefault()},aboutMapClicked:function(e){app.showMapInfo(),e.preventDefault()},shareLinkClicked:function(e){app.showShareLink(),e.preventDefault()},postTwitterClicked:function(t){var n=this.model.attributes,r={},i=app.map.publicUrl(!0);r.url=i,r.text=__("Check out the %(title)s map:",{url:i,title:n.title}),n.twitter&&(r.via=n.twitter);var i="https://twitter.com/share?"+e.param(r);window.open(i,__("Tweet this post"),"width=650,height=251,toolbar=0,scrollbars=0,status=0,resizable=0,location=0,menuBar=0"),t.preventDefault()},postFacebookClicked:function(e){var t=this.model.attributes,n="http://www.facebook.com/sharer.php?u=";n+=encodeURIComponent(window.location.href),n+="&t="+encodeURIComponent(__("Check out the %(title)s map",{title:t.title})),window.open(""+n,__("Share it on Facebook"),"width=650,height=251,toolbar=0,scrollbars=0,status=0,resizable=0,location=0,menuBar=0"),e.preventDefault()},userSignupClicked:function(e){app.showSignup(),e.preventDefault()},userLoginClicked:function(e){app.showLogin(),e.preventDefault()},userLogoutClicked:function(t){return window.location.href=e(t.currentTarget).attr("href")+"?next="+this.model.publicUrl(),t.preventDefault()}});return u});