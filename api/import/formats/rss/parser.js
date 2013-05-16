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

	this.readStream.on('updateElement: item', function(element) {
		self.parse(element);
	});

    return this;
}

RSS.prototype.parse = function(element)
{
	switch (element.$name) {
		// this will parse RSS data such as http://www.gdacs.org/rss.aspx?profile=GDACS
		case 'item':
			var data = {
				type: 'Feature',
				properties: {}
			};

			this.copyFields(['title', 'description', 'link', 'pubDate'], element, data.properties);
			if (data.properties.pubDate) {
				data.properties.pubDate = Cast.Date(data.properties.pubDate);
			}

			if ('geo:Point' in element) {
				data.geometry = {
					type: 'Point',
					coordinates: [
						parseFloat(element['geo:Point']['geo:long']), 
						parseFloat(element['geo:Point']['geo:lat'])]
				};
			}

			if ('georss:point' in element) {
				data.geometry = {
					type: 'Point',
					coordinates: element['georss:point'].split(/[^0-9\.\-]/).map(parseFloat)
				};
			}

			if (data.geometry) {
				this.emit('data', data);
			}
			break;
	}
}

module.exports = RSS;
