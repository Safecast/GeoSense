var PROD = typeof process != 'undefined' && process.env.NODE_ENV == 'production';
var DEV = !PROD; // process.env.NODE_ENV == 'development';

var config = {

	DEV: DEV,
	DEBUG: DEV,	
	LIMITED_PROD_ACCESS: !DEV,

	DEFAULT_HOSTS: [
		'localhost:3000',
		'hollow-warrior-5556.herokuapp.com'
	],

	// since dev server restarts frequently and sessions are lost, circumvent 
	// session-based permissions in debug mode.
	DEBUG_CIRCUMVENT_PERMISSIONS: true,

	COLLECTION_DEFAULTS: {
		visible: true,
		featureType: 'C',
		colorType: 'S',
		colors: [{color: '#00C9FF'}],
		opacity: null
	},

	NUM_ZOOM_LEVELS: 16,

	GRID_SIZES: {
	//	'-1': 2,
		'0': 0.7111111112100985 * 4
	},

	HISTOGRAM_SIZES: [222, 100, 30],

	MIN_CROP_DISTRIBUTION_RATIO: 10000, // if max > min * r --> crop histogram

	// Reserve certain URIs and do not allow them for slugs without modification, such as:
	// "admin", short words, short numbers, base64 uuids 
	RESERVED_URI: /^(admin|[a-z0-9]{1,7}|[0-9]{1,5}|[A-Za-z0-9\+\/]{24})$/,

	REDUCE_SETTINGS: {
		// could be used to pass options to reduce script, such as limit: n
		DB_OPTIONS: {
		},
		// toggles time-based reduction
		TIME_BASED: false,
	},

	DataStatus: {
		IMPORTING: 'I',
		UNREDUCED: 'U',
		UNREDUCED_INC: 'UI',
		REDUCING: 'R',
		COMPLETE: 'C'
	},

	ReductionStatus: {
		IDLE: 'I',
		REDUCING: 'R'
	}
};

for (var zoom = 1; zoom < config.NUM_ZOOM_LEVELS; zoom++) {
	config.GRID_SIZES[zoom] = config.GRID_SIZES[zoom - 1] / 2;
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

if (DEV) {
	// use local db
	config.DB_PATH = 'mongodb://localhost/geo';
} else if (PROD) {
	// import production settings
	if (utils) {
		utils.import(config, require('./config-prod.js'));
	}
}

if (utils) {
	utils.import(config, require("./public/config.js"));
}

if (typeof module != 'undefined') {
	module.exports = config;
}
