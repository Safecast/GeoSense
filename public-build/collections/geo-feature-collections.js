define(["jquery","underscore","backbone","models/map"],function(e,t,n,r){var i=n.Collection.extend({fetchType:null,url:function(){return window.BASE_URL+"api/featurecollections"+(this.fetchType?"/"+this.fetchType:"")},forType:function(e){return this.fetchType=e,this}});return i});