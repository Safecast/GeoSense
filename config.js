var PROD = typeof process != 'undefined' && process.env.NODE_ENV == 'production';
var DEV = !PROD; // process.env.NODE_ENV == 'development';

var config = {

	DEV: DEV,
	DEBUG: DEV,	
	DEBUG_MAPREDUCE: DEV && 0,
	LIMITED_PROD_ACCESS: !DEV,

	CLOCK_PROCESS_RUN_TIME: '0 10 * * * *',

	DEFAULT_HOSTS: [
		'localhost:3000',
		'hollow-warrior-5556.herokuapp.com',
		'geosense.herokuapp.com'
	],

	// since dev server restarts frequently and sessions are lost, circumvent 
	// session-based permissions in debug mode.
	DEBUG_CIRCUMVENT_PERMISSIONS: true,

	LAYER_OPTIONS_DEFAULTS: {
		visible: true,
		featureType: 'P',
		colorType: 'L',
		colorSchemes: [{
			name: 'default',
			colors: [{position: '0%', color: '#44bbee'}/*, {position: '100%', color: '#81ffff'}*/],
		}],
		opacity: .5
	},

	NUM_ZOOM_LEVELS: 20,

	MAP_RESOLUTIONS: [1.4062499998042486, 0.7031249999021243, 0.35156249995106215, 0.17578124997553107, 0.08789062498776554, 0.04394531249388277, 0.021972656246941384, 0.010986328123470692, 0.005493164061735346, 0.002746582030867673, 0.0013732910154338365, 0.0006866455077169183, 0.00034332275385845913, 0.00017166137692922956, 0.00008583068846461478, 0.00004291534423230739, 0.000021457672116153695, 0.000010728836058076848, 0.000005364418029038424, 0.000002682209014519212],

	GRID_SIZES: {
	},

	MIN_FEATURE_SIZE: 1,
	MAX_FEATURE_SIZE: 500,
	MIN_STROKE_WIDTH: .1,
	MAX_STROKE_WIDTH: 200,

	GRID_SIZE_PIXELS: 15,

	API_RESULT_QUERY_OPTIONS: {
		limit: 2000
	},

	HISTOGRAM_SIZES: [222], //, 100, 30],

	MIN_CROP_DISTRIBUTION_RATIO: 10000, // if max > min * r --> crop histogram

	// Reserve certain URIs and do not allow them for slugs without modification, such as:
	// "admin", short words, short numbers, base64 uuids 
	RESERVED_URI: /^(admin|[a-z0-9]{1,7}|[0-9]{1,5}|[A-Za-z0-9\+\/]{24})$/,

	MAPREDUCE_SETTINGS: {
		// could be used to pass options to reduce script, such as limit: n
		DB_OPTIONS: {
		},
		DEFAULT_ENABLED_TYPES: ['tile', 'weekly', 'histogram']
	},

	DataStatus: {
		IMPORTING: 'I',
		IMPORTING_INC: 'II',
		UNREDUCED: 'U',
		UNREDUCED_INC: 'UI',
		REDUCING: 'R',
		REDUCING_INC: 'RI',
		COMPLETE: 'C'
	},

	JobType: {
		IMPORT: 'I',
		REDUCE: 'R'
	},

	JobStatus: {
		ACTIVE: 'A',
		IDLE: 'I'
	}
};

for (var zoom = 0; zoom < config.MAP_RESOLUTIONS.length; zoom++) {
	config.GRID_SIZES[zoom] = config.MAP_RESOLUTIONS[zoom] * config.GRID_SIZE_PIXELS;
}

var utils;
if (typeof require == 'function') {
	// can't import utils since that would result in a circular import
	// utils = require("./utils.js");	
	// re-define import function instead
	utils = {
		import: function(into, mod) {
		    for (var k in mod) {
		        into[k] = mod[k];
		    }
		    return mod;
		}
	};
} 

// import custom settings
if (utils) {
	utils.import(config, require('./config-custom.js'));
}

if (DEV && !config.DB_URI) {
	// use default test db -- this is disabled for now because requiring a DB setting is better
	// config.DB_URI = 'mongodb://localhost/geosense';
}

if (utils) {
	utils.import(config, require("./public/config.js"));
}

if (typeof module != 'undefined') {
	module.exports = config;
}
