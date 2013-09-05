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
        backbone_super: 'lib/backbone_super/backbone_super'
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

require([
	// Load our app module and pass it to our definition function
    'jquery',
    'underscore',
    'backbone',
    'app',
    'jqueryui',
    'bootstrap',
    'backbone_super',
    'lib/jquery/jquery.color',
    'lib/jquery/jquery.glowing',
    'lib/jquery/jquery.miniColors.min',
    'lib/colorpicker/js/colorpicker',
    'locale',
], function($, _, Backbone, App, ui) {
    var app;
	// The "app" dependency is passed in as "App"
	App.initialize();
});

