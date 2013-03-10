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

KML.prototype.parse = function(element)
{
	switch (element.$name) {
		case 'Placemark':
			var data = {
				type: 'Feature',
				properties: {}
			};

			if (element.name) {
				data.properties.name = element.name;
			}

			if (element.description) {
				data.properties.description = element.description;
			}

			if (element.Point) {
				var coordinates = element.Point.coordinates.split(',').map(
					function(c) { return Number(c); }
				);
				data.geometry = {
					type: 'Point',
					coordinates: coordinates
				};
			}

			if (element.LineString) {
				var coordinates = element.LineString.coordinates.split(/\s+/).map(function(c) {
					return c.split(',').map(
						function(c) { return Number(c); }
					);
				});
				data.geometry = {
					type: 'LineString',
					coordinates: coordinates
				};
			}

			if (element.Polygon) {
				var coordinates = [];
				if (element.Polygon.outerBoundaryIs) {
					coordinates.push(element.Polygon.outerBoundaryIs.LinearRing.coordinates
						.split(/\s+/).map(function(c) {
							return c.split(',').map(
								function(c) { return Number(c); }
							);
						})
					);
				}
				if (element.Polygon.innerBoundaryIs) {
					coordinates.push(element.Polygon.innerBoundaryIs.LinearRing.coordinates
						.split(/\s+/).map(function(c) {
							return c.split(',').map(
								function(c) { return Number(c); }
							);
						})
					);
				}
				data.geometry = {
					type: 'Polygon',
					coordinates: coordinates
				};
			}

			if (element.ExtendedData && element.ExtendedData.SchemaData && element.ExtendedData.SchemaData.SimpleData) {
				var d = element.ExtendedData.SchemaData.SimpleData;
				for (var i = 0; i < d.length; i++) {
					data.properties[d[i].$.name] = Cast[this.fieldTypes[d[i].$.name]](d[i].$text);
				}
			}

			if (data.geometry) {
				this.emit('data', data);
			}
	}
}

module.exports = KML;
