var utils = require("./utils.js")

var PROD = process.env.NODE_ENV == 'production';
var DEV = process.env.NODE_ENV == 'development';

var e = {
	DEBUG: DEV,	
	DEBUG_CIRCUMVENT_PERMISSIONS: true,

	COLLECTION_DEFAULTS: {
		visible: true,
		featureType: 'C',
		colorType: 'S',
		colors: [{color: '#00C9FF'}],
		opacity: null
	},

	MIN_CROP_DISTRIBUTION_RATIO: 10000, // if max > min * r --> crop histogram

	// Reserve certain URIs and do not allow them for slugs without modification, such as:
	// "admin", short words, short numbers, MD5 hashes 
	RESERVED_URI: /^(admin|[a-z0-9]{1,8}|[0-9]{1,5}|[a-f0-9]{32})$/
};

if (DEV) {
	// use local db
	e.DB_PATH = 'mongodb://localhost/geo';
} else if (PROD) {
	// import production settings
	utils.import(e, require('./config-prod.js'));
}

utils.import(e, require("./public/config.js"));

module.exports = e;