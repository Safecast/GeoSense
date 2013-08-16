define(["jquery","underscore","backbone","collections/map-features","lib/color-gradient/color-gradient","deepextend","deepmodel"],function(e,t,n,r,i){var s=n.DeepModel.extend({idAttribute:"_id",urlRoot:function(){return this.parentMap.url()+"/layer"},getLayerOptions:function(){return this.attributes.layerOptions?this.attributes.layerOptions:{}},setLayerOptions:function(e){for(var t in e)this.set("layerOptions."+t,e[t])},getFeatureCollectionAttr:function(e,t){return this.attributes.featureCollection&&this.attributes.featureCollection[e]!=undefined?this.attributes.featureCollection[e]:t!=undefined?t:null},getOption:function(e,t){var n=this.attributes.layerOptions;return!n||n[e]==undefined?t:n[e]},limitFeatures:function(){return this.getFeatureCollectionAttr("limitFeatures",!0)},getDataStatus:function(){return this.getFeatureCollectionAttr("status",DataStatus.COMPLETE)},getBbox:function(){return this.getFeatureCollectionAttr("bbox",[])},getDisplay:function(e){var t=this.attributes.layerOptions,n=this.attributes.featureCollection,r=n?n.defaults:{};return t&&t[e]&&(typeof t[e]!="string"||t[e].length)?t[e]:n?n[e]:r?r[e]:null},initialize:function(e,n){var i=this,n=n||{};this.parentMap=n.parentMap;if(this.attributes.featureCollection)this.featureCollection=new r([],{mapLayer:this});else{var s=this.getLayerOptions().feed;this.featureCollection=new r([],{mapLayer:this,urlFormat:s?s.url:"",parser:s?s.parser:""})}this.valFormatters=[],this.sessionOptions=t.extend(n.sessionOptions||{},{enabled:this.attributes.layerOptions?this.attributes.layerOptions.enabled:!0,valFormatterIndex:0,colorSchemeIndex:e&&e.layerOptions?e.layerOptions.colorSchemeIndex:0}),this.on("change",this.onChange,this),this.initValFormatters()},onChange:function(){delete this._normalizedColors,delete this._colorGradient,this.initValFormatters()},initValFormatters:function(){var e=this;this.valFormatters=[],this.attributes.layerOptions&&!this.attributes.layerOptions.unit&&(!this.attributes.layerOptions.unit+"").length&&this.attributes.layerOptions.valFormat&&this.attributes.layerOptions.valFormat.length?t.each(this.attributes.layerOptions.valFormat,function(t){e.valFormatters.push(new ValFormatter(t))}):this.valFormatters.push(new ValFormatter({unit:this.getDisplay("unit")})),this.setValFormatter(Math.min(this.valFormatters.length-1,this.sessionOptions.valFormatterIndex))},getValFormatter:function(){return this.valFormatters[this.sessionOptions.valFormatterIndex]},getValFormatters:function(){return this.valFormatters},setValFormatter:function(e){this.sessionOptions.valFormatterIndex=e,this.trigger("toggle:valFormatter",this)},setColorScheme:function(e){delete this._normalizedColors,delete this._colorGradient,this.sessionOptions.colorSchemeIndex=e,this.trigger("toggle:colorScheme",this)},getCounts:function(){return this.featureCollection.counts},isNumeric:function(){var e=this.getFeatureCollectionAttr("extremes",{}),t=this.getOption("attrMap",{}),n=t.numeric;return n!=undefined&&getAttr(e,n)!=undefined},getMappedExtremes:function(){var e=this.getFeatureCollectionAttr("extremes",{}),t=this.getOption("attrMap",{}),n={};for(var r in t)n[r]=getAttr(e,t[r]);return n},colorAt:function(e){return this._colorGradient||(this._colorGradient=new i(this.getNormalizedColors())),this._colorGradient.colorAt(e,COLOR_GRADIENT_STEP)},getColorScheme:function(e){var e=e!=undefined?e:this.sessionOptions.colorSchemeIndex,t=this.getLayerOptions().colorSchemes;return t?e?t[e]:t[0]:{colors:[]}},getNormalizedColors:function(e){var n=this,e=e||this.getColorScheme().colors,r=this.getMappedExtremes();return this._normalizedColors||(this._normalizedColors=e.map(function(e){var n=parseFloat(e.position),n=isNaN(n)?1:n,i=(e.position||"")+"";return t.extend({},e,{position:i[i.length-1]=="%"?n/100:r.numeric?(n-r.numeric.min)/(r.numeric.max-r.numeric.min):0})})),this._normalizedColors},toggleEnabled:function(e){this.sessionOptions.enabled!=e&&(this.sessionOptions.enabled=e,this.trigger("toggle:enabled",this))},isEnabled:function(){return this.sessionOptions.enabled},canDisplayValues:function(){var e=this.getDataStatus();return e==DataStatus.COMPLETE||e==DataStatus.UNREDUCED_INC||e==DataStatus.REDUCING_INC||e==DataStatus.IMPORTING_INC},hasChangedColors:function(){var e=this.previousAttributes();if(!e.layerOptions)return!0;var n=e.layerOptions.colorSchemes,r=this.attributes.layerOptions.colorSchemes;return this.hasChanged("layerOptions.colorLabelColor")||n&&r&&!t.isEqual(n,r)}});return s});