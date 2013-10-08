define(["jquery","underscore","backbone","config","utils","text!templates/data-library-panel.html","views/data-library-view"],function(e,t,n,r,i,s,o){var u=o.extend({className:"panel panel-default panel-anchor-left panel-scrollable layers-panel data-library",draggable:!1,events:{"submit form.search, keypress form.search .search-query":"searchClicked","click button.remove-query":"removeQueryClicked","click button.add-layer":"addLayerButtonClicked"},initialize:function(e){u.__super__.initialize.apply(this,arguments),this.template=t.template(s)},render:function(){var t=this;return u.__super__.render.call(this),this.on("panel:show",function(){(!t.searchParams.q||t.searchParams.q=="")&&t.removeSubViews("")}),this.on("panel:shown",function(){setTimeout(function(){if(!t.searchParams.q||t.searchParams.q=="")t.resetPageParams(),t.fetchResults(t.searchParams)},250),t.$(".search-query").focus()}),e(window).on("resize",function(){if(t.isLoading)return;var e=t.detectPageLimit();!t.isLastPage&&t.numResults()<e&&(t.searchParams.l=e,t.fetchResults(t.searchParams))}),this.$dropZone=t.$(".drop-zone").remove(),this},dataDrop:function(e,t){var n=t.draggable.attr("data-feature-collection-id");app.saveNewMapLayer(n)},addLayerButtonClicked:function(t){var n=e(t.currentTarget).closest(".map-layer").attr("data-feature-collection-id");return app.saveNewMapLayer(n),!1},mapLayerViewPostRender:function(t){var n=this;t.$el.draggable({revert:"invalid",start:function(t,r){n.$dropZone.css({left:n.$el.outerWidth()+"px"}).droppable({accept:".map-layer",hoverClass:"hover",drop:n.dataDrop}),e("#main-viewport").append(n.$dropZone),n.$dropZone.addClass("visible"),r.helper.css("width",e(this).outerWidth()+"px"),r.helper.addClass("drag-helper")},helper:"clone",appendTo:n.$el,stop:function(e,t){n.$dropZone.removeClass("visible").remove()}})}});return u});