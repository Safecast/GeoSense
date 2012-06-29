var PROD = typeof process != 'undefined' && process.env.NODE_ENV == 'production';
var DEV = !PROD; // process.env.NODE_ENV == 'development';

var config = {

	DEBUG: DEV,	

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
	// "admin", short words, short numbers, MD5 hashes 
	RESERVED_URI: /^(admin|[a-z0-9]{1,7}|[0-9]{1,5}|[a-f0-9]{32})$/,

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
		REDUCING: 'R',
		COMPLETE: 'C'
	}
};

for (var zoom = 1; zoom < config.NUM_ZOOM_LEVELS; zoom++) {
	config.GRID_SIZES[zoom] = config.GRID_SIZES[zoom - 1] / 2;
}

var utils;
if (typeof require == 'function') {
	utils = require("./utils.js");	
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
