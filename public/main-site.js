require.config({
	paths: {
        //jqueryui: 'lib/jquery-ui/js/jquery-ui-1.10.0.custom.min',
        jqueryui: 'lib/jquery-ui/js/jquery-ui-1.10.3.custom.min',
    	underscore: 'lib/underscore/underscore-min',
    	backbone: 'lib/backbone/backbone',
        bootstrap: 'lib/bootstrap/dist/js/bootstrap.min', 
        d3: 'lib/d3/d3.v2.min',
    	text: 'lib/require/text',
        locale: 'locale/locale.en',
        deepextend: 'lib/backbone-deep-model/lib/underscore.mixin.deepExtend',
        deepmodel: 'lib/backbone-deep-model/src/deep-model',
        openlayers: 'lib/openlayers/OpenLayers-2.12/OpenLayers',
        cloudmade: 'lib/openlayers/cloudmade',
        stamen: 'lib/openlayers/stamen',
        backbone_super: 'lib/backbone_super/backbone_super',
        moment: 'lib/moment/moment.min',
        holder: 'lib/holder/holder.min',
        spin: 'lib/spin/spin.min'
  	},

    shim: {
        'spin': {
            exports: 'Spinner'
        },
        'underscore': {
            exports: '_'
        },
        'backbone': {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        'd3': {
            exports: 'd3'
        },
        'deepextend': {
            deps: ['underscore']
        },
        'openlayers': {
            exports: 'OpenLayers'
        },
        'cloudmade': {
            deps: ['openlayers']
        },
        'stamen': {
            deps: ['openlayers']
        },
        'backbone_super': {
            deps: ['backbone'],
        }
    }

});

define([
	// Load our app module and pass it to our definition function
    'jquery',
    'underscore',
    'backbone',
    'site-router',
    'jqueryui',
    'bootstrap',
    'backbone_super',
    'locale'
], function($, _, Backbone, App) {
	return App;
});

