define([
	'jquery',
	'underscore',
	'backbone',
	'models/map-layer',
	'deepextend',
	'deepmodel',
], function($, _, Backbone, MapLayer) {
	"use strict";
	
	var Map = Backbone.DeepModel.extend({
		
		idAttribute: 'slug',
		urlRoot: BASE_URL + 'api/map',

		url: function()
		{
			return this.urlRoot + '/' + this.publicUri({omitSlug: false});
		},

		isPrivate: function()
		{
			return this.attributes.sharing != SharingType.WORLD;
		},

		adminUri: function(options) 
		{
			var publicUri = this.publicUri(_.extend(
				{slug: this.attributes.slug}, options));
			return 'admin' + (publicUri != '' ? '/' + publicUri : '');
		},

		publicUri: function(options)
		{
			var o = options || {},
				secret = o.secret != undefined ? 
					o.secret : this.isPrivate(),
				uri = (!this.isCustomHost || (o.omitSlug != undefined && !o.omitSlug) ? 
						(o.slug ? o.slug : 
							secret ? 
								's/' + this.attributes.secretSlug : this.attributes.slug) 
						: '')
					+ (o.view ? '/' + o.view : '');

			if (o.x != undefined && o.y != undefined) {
				uri += '/' + (o.x || 0) + ',' + (o.y || 0);
				if (o.zoom != undefined) {
					uri += ',' + o.zoom;
				}
			}

			return uri;
		},

		adminUrl: function(options) 
		{
			return BASE_URL + this.adminUri(options);
		},

		publicUrl: function(options)
		{
			return BASE_URL + this.publicUri(options);
		},

		newLayerInstance: function(attributes, options) 
		{
			var options = options || {};
			options.parentMap = this;
			return new MapLayer(attributes, options);
		}

	});

	return Map;
});