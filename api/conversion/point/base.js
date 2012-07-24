var ConversionError = require('../conversion.js').ConversionError;

var clamp180 = function(deg) 
{
	if (deg < -360 || deg > 360) {
		deg = deg % 360;	
	} 
	if (deg < -180) {
		deg = 180 + deg % 180;
	}
	if (deg > 180) {
		deg = 180 - deg % 180;
	}
	if (deg == 180) {
		deg = -180;
	}

	return deg;
};

/**
* Converts a string like ' y.yyy ,  -xx.x' to [x, y]
*/	
this.latLngWithCommaFromString = function(field) 
{
	return function() {
		var match = String(this.get(field)).match(/^\s*([0-9\.\-]+)\s*[,\ ]\s*([0-9\.\-]+)\s*$/);
		if (match) {
			return [clamp180(parseFloat(match[2])), clamp180(parseFloat(match[1]))]
		};
		return new ConversionError();
	}
};

/**
* Converts a string like ' y.yyy ,  -xx.x' to [x, y]
*/	
this.locFromFields = function(lngFields, latFields) 
{
	if (typeof lngFields == 'string') {
		var lngFields = [lngFields];
	}
	if (typeof latFields == 'string') {
		var latFields = [latFields];
	}

	return function() {
		var lng, lat;
		for (var i = 0; i < lngFields.length; i++) {
			var lng = this.get(lngFields[i]);
			if (lng != undefined) break;
		}
		for (var i = 0; i < latFields.length; i++) {
			var lat = this.get(latFields[i]);
			if (lat != undefined) break;
		}
		lng = parseFloat(lng);
		lat = parseFloat(lat);
		if (!isNaN(lng) && !isNaN(lat) && lng != undefined && lat != undefined) {
			return [clamp180(lng), clamp180(lat)]
		};
		return new ConversionError();
	}
};

this.PointConverter = 
{
	fields: {
		val: function() {
			return parseFloat(this.get('val'));
		}
		,datetime: function() {
			var d = Date.parse(String(this.get('date')));
			return new Date(d);
		}
		,loc: this.latLngWithCommaFromString('loc')
	}
};
