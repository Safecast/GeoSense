define(["jquery","underscore","backbone","models/map-layer","deepextend","deepmodel"],function(e,t,n,r){var i=n.DeepModel.extend({idAttribute:"slug",urlRoot:BASE_URL+"api/map",url:function(){return this.urlRoot+"/"+this.publicUri({omitSlug:!1})},isPrivate:function(){return this.attributes.sharing!=SharingType.WORLD},adminUri:function(e){var n=this.publicUri(t.extend({slug:this.attributes.slug},e));return"admin"+(n!=""?"/"+n:"")},publicUri:function(e){var t=e||{},n=t.secret!=undefined?t.secret:this.isPrivate(),r=(!this.isCustomHost||t.omitSlug!=undefined&&!t.omitSlug?t.slug?t.slug:n?"s/"+this.attributes.secretSlug:this.attributes.slug:"")+(t.view?"/"+t.view:"");return t.x!=undefined&&t.y!=undefined&&(r+="/"+(t.x||0)+","+(t.y||0),t.zoom!=undefined&&(r+=","+t.zoom)),r},adminUrl:function(e){return BASE_URL+this.adminUri(e)},publicUrl:function(e){return BASE_URL+this.publicUri(e)},newLayerInstance:function(e,t){var t=t||{};return t.parentMap=this,new r(e,t)}});return i});