var XML = require('../xml/parser'),
	Cast = require('../../data_transform').Cast,
	util = require('util');

var KML = function()
{
	XML.call(this);
};

util.inherits(KML, XML);

KML.prototype.fromStream = function(readStream, options)
{
	var self = this;
	KML.super_.prototype.fromStream.call(this, readStream, options);
	this.fieldTypes = {};

	this.readStream.collect('SimpleField');
	this.readStream.collect('Point');
	this.readStream.collect('LineString');
	this.readStream.collect('Polygon');
	this.readStream.collect('MultiGeometry');
	this.readStream.on('updateElement: Schema', function(element) {
		if (element.SimpleField) {
			for (var i = 0; i < element.SimpleField.length; i++) {
				var type;
				switch (element.SimpleField[i].$.type) {
					default:
					case 'string':
						type = 'String';
						break;
					case 'int':
					case 'uint':
					case 'short':
					case 'ushort':
					case 'float':
					case 'double':
					case 'bool':
						type = 'Number';
						break;
				}
				self.fieldTypes[element.SimpleField[i].$.name] = type;
			}
		}
	});

	this.readStream.collect('SimpleData');
	this.readStream.on('updateElement: Placemark', function(element) {
		self.parse(element);
	});

    return this;
}

KML.prototype.parseGeometry = function(element, emitData) 
{
	var self = this,
		data = emitData;

	if (element.Point) {
		data.geometry = {
			coordinates: []
		};
		element.Point.forEach(function(item) {
			var coordinates = item.coordinates.split(',').map(
				function(c) { return Number(c); }
			);
			data.geometry.coordinates.push(coordinates);
		});

		if (data.geometry.coordinates.length == 1) {
			data.geometry.type = 'Point';
			data.geometry.coordinates = data.geometry.coordinates[0];
		} else {
			data.geometry.type = 'MultiPoint';
		}
	} else

	if (element.LineString) {
		data.geometry = {
			coordinates: []
		};
		element.LineString.forEach(function(item) {
			var coordinates = item.coordinates.split(/\s+/).map(function(c) {
				return c.split(',').map(
					function(c) { return Number(c); }
				);
			});
			data.geometry.coordinates.push(coordinates);
		});

		if (data.geometry.coordinates.length == 1) {
			data.geometry.type = 'LineString';
			data.geometry.coordinates = data.geometry.coordinates[0];
		} else {
			data.geometry.type = 'MultiLineString';
		}
	} else

	if (element.Polygon) {
		data.geometry = {
			coordinates: []
		};
		element.Polygon.forEach(function(item) {
			var coordinates = [];
			if (item.outerBoundaryIs) {
				coordinates.push(item.outerBoundaryIs.LinearRing.coordinates
					.split(/\s+/).map(function(c) {
						return c.split(',').map(
							function(c) { return Number(c); }
						);
					})
				);
			}
			if (element.Polygon.innerBoundaryIs) {
				coordinates.push(item.innerBoundaryIs.LinearRing.coordinates
					.split(/\s+/).map(function(c) {
						return c.split(',').map(
							function(c) { return Number(c); }
						);
					})
				);
			}
			data.geometry.coordinates.push(coordinates);
		});

		if (data.geometry.coordinates.length == 1) {
			data.geometry.type = 'Polygon';
			data.geometry.coordinates = data.geometry.coordinates[0];
		} else {
			data.geometry.type = 'MultiPolygon';
		}
	} else

	if (element.MultiGeometry) {

		element.MultiGeometry.forEach(function(element) {
			self.parse(element, data);
		});

	} else {
		console.warn('unhandled geometry in ' + element.$name);
	}

};

KML.prototype.parse = function(element)
{
	var self = this;

	switch (element.$name) {
		case 'Placemark':
		case 'MultiGeometry':
			var data = {
				type: 'Feature',
				properties: {},
			};

			if (element.name) {
				data.properties.name = element.name;
			}

			if (element.description) {
				data.properties.description = element.description;
			}

			if (element.ExtendedData && element.ExtendedData.SchemaData && element.ExtendedData.SchemaData.SimpleData) {
				var d = element.ExtendedData.SchemaData.SimpleData;
				for (var i = 0; i < d.length; i++) {
					data.properties[d[i].$.name] = Cast[this.fieldTypes[d[i].$.name]](d[i].$text);
				}
			}

			this.parseGeometry(element, data);
			if (data.geometry) {
				this.emit('data', data);
			}
	}
}

module.exports = KML;
