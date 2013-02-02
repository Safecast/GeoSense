// Filename: main.js

// Require.js allows us to configure shortcut alias
// There usage will become more apparent further along in the tutorial.
require.config({
	paths: {
        jqueryui: 'lib/jquery/jquery-ui.min',
    	underscore: 'lib/underscore/underscore',
    	backbone: 'lib/backbone/backbone',
        bootstrap: 'lib/bootstrap/js/bootstrap.min', 
        d3: 'lib/d3/d3.v2.min',
    	text: 'lib/require/text',
        locale: 'locale/locale.en'
  	},

    shim: {
        'underscore': {
            exports: '_'
        },
        'backbone': {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        'd3': {
            exports: 'd3'
        }
    }

});

require([
	// Load our app module and pass it to our definition function
	'jquery',
    'app',
    'jqueryui',
    'lib/jquery/jquery.color',
    'lib/jquery/jquery.glowing',
    'lib/jquery/jquery.miniColors.min',
    'bootstrap',
    'locale'
], function($, App, ui) {
	// The "app" dependency is passed in as "App"
	App.initialize();
});

