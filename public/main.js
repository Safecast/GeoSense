// Filename: main.js

// Require.js allows us to configure shortcut alias
// There usage will become more apparent further along in the tutorial.
require.config({
	paths: {
        jqueryui: 'lib/jquery-ui/js/jquery-ui-1.10.0.custom.min',
    	underscore: 'lib/underscore/underscore-min',
    	backbone: 'lib/backbone/backbone',
        bootstrap: 'lib/bootstrap/js/bootstrap.min', 
        d3: 'lib/d3/d3.v2.min',
    	text: 'lib/require/text',
        locale: 'locale/locale.en',
        deepextend: 'lib/backbone-deep-model/lib/underscore.mixin.deepExtend',
        deepmodel: 'lib/backbone-deep-model/src/deep-model',
        openlayers: 'lib/openlayers/OpenLayers-2.12/OpenLayers',
        cloudmade: 'lib/openlayers/cloudmade',
        stamen: 'lib/openlayers/stamen'
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
    'lib/jquery/jquery.color',
    'lib/jquery/jquery.glowing',
    'lib/jquery/jquery.miniColors.min',
    'lib/colorpicker/js/colorpicker',
    'bootstrap',
    'locale',
], function($, _, Backbone, App, ui) {
	// The "app" dependency is passed in as "App"
	App.initialize();
});

