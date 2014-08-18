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
				omitSlug = this.isCustomHost || o.omitSlug,
				secret = o.secret != undefined ? 
					o.secret : this.isPrivate(),
				uri = (!omitSlug ? 
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
			var base = BASE_URL,
				opts = _.extend({}, options);
			if (this.attributes.host && this.attributes.host != '') {
				opts.omitSlug = true;
				base = 'http://' + this.attributes.host + '/';
			}
			return base + this.publicUri(opts);
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