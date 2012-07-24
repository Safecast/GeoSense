var base = require('./base.js');

this.PointConverter = {
	fields: {
		val: function() {
			return parseFloat(this.get('value')) * (this.get('unit') == 'cpm' ? 1.0 : 350.0);
		}
		/*,altVal: function() {
			return [parseFloat(this.get('value'))] / (this.get('unit') == 'cpm' ? 350.0 : 1.0);
		}*/
		,datetime: function() {
			return new Date(this.get('captured_at'));
		}
		,loc: base.locFromFields(['lng', 'longitude'], ['lat', 'latitude'])
		,sourceId: function() {
			return this.get('sourceId');
		}
		,incField: function() {
			return this.get('sourceId');
		}
	}
};
