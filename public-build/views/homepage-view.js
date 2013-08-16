define(["jquery","underscore","backbone","config","utils","text!templates/homepage.html","models/map","collections/maps"],function(e,t,n,r,i,s,o,u){var a=n.View.extend({tagName:"div",className:"homepage",events:{"click #createMap":"createMapButtonClicked","click #nextMapSet":"nextMapSetClicked"},initialize:function(e){this.template=t.template(s),this.fetchFeaturedMaps(),this.featuredMaps=[],this.featuredMapSet=0,this.numberOfMapsDisplay=5},render:function(){return e(this.el).html(this.template()),this},fetchFeaturedMaps:function(){var e=this;(new u).forType("featured").fetch({success:function(t,n,r){t.each(function(t){var n=genMapURL(t.attributes);e.featuredMaps.push("<tr><td>"+t.attributes.title+'</td><td><a target="_self" href="'+n+'">'+n+"</a></td><tr>")}),app.setUIReady(),e.showRecentMaps()},error:function(e,t,n){app.setUIReady(),console.error("failed to fetch unique map")}})},showRecentMaps:function(){this.featuredMapSet+this.numberOfMapsDisplay>=this.featuredMaps.length&&this.$("#nextMapSet").fadeOut("fast");var e=this;e.$("#mapTable").fadeOut("fast",function(){e.$("#mapTable").empty();for(var t=e.featuredMapSet;t<e.numberOfMapsDisplay+e.featuredMapSet;t++)e.$("#mapTable").append(e.featuredMaps[t]);e.$("#mapTable").fadeIn("fast")})},nextMapSetClicked:function(){this.featuredMapSet+=this.numberOfMapsDisplay,this.showRecentMaps()},createMapButtonClicked:function(){var e=this,t={title:this.$("#appendedPrependedInput").val()};!t.title||t.title==""?this.$("#errorMessage").show():(console.log("creating map",t),(new o).save(t,{success:function(e,t,n){console.log("new map created"),window.location.href=e.publicAdminUrl()+"/setup"},error:function(e,t,n){console.error("failed to create a new map")}}))}});return a});