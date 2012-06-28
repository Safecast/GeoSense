var base = require('./base.js');

this.PointConverter = {
	fields: {
		val: function() {
			return parseFloat(this.get('val'));
		}
		,datetime: function() {
			return new Date(String(this.get('year')));
		},
		label: function() {
			return this.get('Facility') + ' (' + this.get('ISO country code') + ')';
		}
		,loc: base.latLngWithCommaFromString('location')
	}
};
