var e = {
	COLLECTION_DEFAULTS: {
		visible: true,
		featureType: 'C',
		colorType: 'S',
		colors: [{color: '#00C9FF'}],
		opacity: null
	},

	MIN_CROP_DISTRIBUTION_RATIO: 10000 // if max > min * r --> crop histogram
};

module.exports = e;