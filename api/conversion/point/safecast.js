var base = require('./base.js');

this.PointConverter = {
	fields: {
		val: function() {
			return parseFloat(this.get('Value')) * (this.get('Unit') == 'cpm' ? 1.0 : 350.0);
		}
		/*,altVal: function() {
			return [parseFloat(this.get('value'))] / (this.get('unit') == 'cpm' ? 350.0 : 1.0);
		}*/
		,datetime: function() {
			return new Date(this.get('Captured Time'));
		}
		,loc: base.locFromFields(['lng', 'Longitude'], ['lat', 'Latitude'])
		,sourceId: function() {
			return this.get('MD5Sum');
		}
		,incField: function() {
			return this.get('Captured Time');
		}
	}
};
