var XML = require('../xml/parser'),
	Cast = require('../../data_transform').Cast,
	util = require('util');

var RSS = function()
{
	XML.call(this);
};

util.inherits(RSS, XML);

RSS.prototype.fromStream = function(readStream, options)
{
	var self = this;
	RSS.super_.prototype.fromStream.call(this, readStream, options);
	this.fieldTypes = {};

	['updateElement: item', 'updateElement: entry'].forEach(function(on) {
		self.readStream.on(on, function(element) {
			self.parse(element);
		});
	});

    return this;
}

RSS.prototype.parse = function(element)
{
	switch (element.$name) {
		// this will parse RSS data such as http://www.gdacs.org/rss.aspx?profile=GDACS,
		// and Atom data such as http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.atom
		case 'item':
		case 'entry':
			var data = {
				type: 'Feature',
				properties: {}
			};

			this.copyFields(['title', 'description', 'summary', 'link', 'pubDate', 'updated'], element, data.properties);

			// Atom fields
			if (typeof data.properties.link == 'object' && data.properties.link.$) {
				data.properties.link = data.properties.link.$.href;
			}
			if (typeof data.properties.summary == 'object' && data.properties.summary.$) {
				data.properties.summary = data.properties.summary.$text;
			}

			if (data.properties.pubDate) {
				data.properties.pubDate = Cast.Date(data.properties.pubDate);
			}

			if ('geo:Point' in element) {
				data.geometry = {
					type: 'Point',
					coordinates: [
						parseFloat(element['geo:Point']['geo:lat']),
						parseFloat(element['geo:Point']['geo:long'])] 
				};
			}

			if ('georss:point' in element) {
				data.geometry = {
					type: 'Point',
					coordinates: element['georss:point']
						.split(/[^0-9\.\-]/).map(parseFloat)
						.reverse()
				};
			}

			if (data.geometry) {
				this.emit('data', data);
			}
			break;
	}
}

module.exports = RSS;
