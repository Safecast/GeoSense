var base = require('./base.js');

this.PointConverter = {
	fields: {
		val: function() {
			return parseFloat(this.get('mag'));
		}
		,datetime: function() {
			return new Date(this.get('year'), this.get('month') - 1, this.get('day'));
		}
		,loc: base.latLngWithCommaFromString('location')
	}
};