var utils = require("./utils.js")

var e = {
	DEBUG_CIRCUMVENT_PERMISSIONS: true,

	COLLECTION_DEFAULTS: {
		visible: true,
		featureType: 'C',
		colorType: 'S',
		colors: [{color: '#00C9FF'}],
		opacity: null
	},

	MIN_CROP_DISTRIBUTION_RATIO: 10000 // if max > min * r --> crop histogram
};

utils.import(e, require("./public/config.js"));

module.exports = e;