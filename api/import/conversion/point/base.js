var ConversionError = this.ConversionError = require('../').ConversionError;

var clamp180 = this.clamp180 = function(deg) 
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
this.latLngWithCommaFromString = function(field, latIndex, lngIndex) 
{
	var latI = latIndex != undefined ? latIndex : 0;
	var lngI = latIndex != undefined ? latIndex : 1;
	return function() {
		var match = String(this.get(field)).match(/^\s*([0-9\.\-]+)\s*[,\ ]\s*([0-9\.\-]+)\s*$/);
		if (match) {
			return [clamp180(parseFloat(match[lngI + 1])), clamp180(parseFloat(match[latI + 1]))]
		};
		return new ConversionError('string not matching supported format: '+this.get(field));
	}
};

/**
* Converts a string like ' y.yyy ,  -xx.x' to [x, y]
*/	
this.smartLatLng = function(field) 
{
	var fromStringFuncs = [
		this.latLngWithCommaFromString('loc'),
		this.latLngWithCommaFromString('location')
	];
	return function() {
		var lng = this.get('longitude') || this.get('lng') || this.get('lon') || this.get('x'),
			lat = this.get('latitude') || this.get('lat') || this.get('y');
		if (!lng || !lat) {
			var val = this.get('loc') || this.get('location');
			if (val instanceof Array) {
				lng = val[0];
				lat = val[1];
			}
		}
		if (lng && lat) {
			lng = parseFloat(lng);
			lat = parseFloat(lat);
			if (!isNaN(lng) && !isNaN(lat)) {
				var a = [clamp180(lng), clamp180(lat)];
				return a;
			}
		}
		for (var i = 0; i < fromStringFuncs.length; i++) {
			var conv = fromStringFuncs[i].apply(this);
			if (!(conv instanceof ConversionError)) {
				break;
			}
		}
		return conv;
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
		lngF = parseFloat(lng);
		latF = parseFloat(lat);
		if (!isNaN(lngF) && !isNaN(latF) && lng != undefined && lat != undefined) {
			return [clamp180(lngF), clamp180(latF)]
		};
		return new ConversionError('invalid lng,lat: '+lng+','+lat);
	}
};

// TODO: Repair base converter
this.fields = {
	val: function() {
		var val = this.get('val');
		if (val) {
			return parseFloat(val);
		}
		return null;
	}
	,datetime: function() {
		var d = Date.parse(String(this.get('date')));
		if (d) {
			return new Date(d);
		}
		return null;
	}
	,label: function() {
		return this.get('label') || this.get('name');
	}
	,loc: this.smartLatLng()
	,sourceId: function() {
		var id = this.get('sourceId');
		if (id) {
			numId = parseInt(id);
			if (!isNaN(numId)) {
				return numId;
			}
			return id;
		}
		return null;
	}
};

