var base = require('./base.js'),
	time = require('time'),
	models = require('../../../models.js'),
	ConversionError = require('../conversion.js').ConversionError;

var stations = {};

//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//:::                                                                         :::
//:::  This routine calculates the distance between two points (given the     :::
//:::  latitude/longitude of those points). It is being used to calculate     :::
//:::  the distance between two locations using GeoDataSource (TM) prodducts  :::
//:::                                                                         :::
//:::  Definitions:                                                           :::
//:::    South latitudes are negative, east longitudes are positive           :::
//:::                                                                         :::
//:::  Passed to function:                                                    :::
//:::    lat1, lon1 = Latitude and Longitude of point 1 (in decimal degrees)  :::
//:::    lat2, lon2 = Latitude and Longitude of point 2 (in decimal degrees)  :::
//:::    unit = the unit you desire for results                               :::
//:::           where: 'M' is statute miles                                   :::
//:::                  'K' is kilometers (default)                            :::
//:::                  'N' is nautical miles                                  :::
//:::                                                                         :::
//:::  Worldwide cities and other features databases with latitude longitude  :::
//:::  are available at http://www.geodatasource.com                          :::
//:::                                                                         :::
//:::  For enquiries, please contact sales@geodatasource.com                  :::
//:::                                                                         :::
//:::  Official Web site: http://www.geodatasource.com                        :::
//:::                                                                         :::
//:::               GeoDataSource.com (C) All Rights Reserved 2012            :::
//:::                                                                         :::
//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
function distance(lat1, lon1, lat2, lon2, unit) {
	var radlat1 = Math.PI * lat1/180
	var radlat2 = Math.PI * lat2/180
	var radlon1 = Math.PI * lon1/180
	var radlon2 = Math.PI * lon2/180
	var theta = lon1-lon2
	var radtheta = Math.PI * theta/180
	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	dist = Math.acos(dist)
	dist = dist * 180/Math.PI
	dist = dist * 60 * 1.1515
	if (unit=="K") { dist = dist * 1.609344 }
	if (unit=="N") { dist = dist * 0.8684 }
	return dist;
}                                                                           


this.PointConverter = {
	init: function(callback) {
		models.PointCollection.findOne({title: 'stations.csv'}, function(err, doc) {
			models.Point.find({pointCollection: doc._id}, function(err, docs) {
				for (var i = 0; i < docs.length; i++) {
					stations[docs[i].get('sourceId')] = docs[i];
				}
				console.log('Loaded stations: ', docs.length);
				callback();
			})
		});
	},
	fields: {
		datetime: function() {
			return new time.Date(String(this.get('start_date') + ':00'));
		}
		/*
		,label: function() {
			return this.get('bike_nr');
		}
		*/
		,loc: function() {
			return stations[this.get('start_station')].loc;
		}
		,extra: function() {

			var f = [
				'id',
				'status',
				'start_date',
				'start_station',
				'end_date',
				'end_station',
				'bike_nr',
				'subscription_type',
				'zip_code',
				'birth_date',
				'gender',
			];

			var extra = {};
			for (var i = f.length - 1; i >= 0; i--) {
				var v = this.get(f[i]);
				if (v.match(/^[0-9\.]+$/)) {
					extra[f[i]] = parseFloat(v);
				} else if (v.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}/)) {
					extra[f[i]] = new Date(new time.Date(String(v + ':00')));
				} else {
					extra[f[i]] = v;
				}
			}

			extra.week_day = extra.start_date.getDay();

			var duration = parseFloat(this.get('duration'));
			if (duration) {
				var mins = duration / 60.0;
				if (mins < 1) {
					return new ConversionError('ignoring short trip');
				}
				if (mins > 120) {
					return new ConversionError('ignoring long trip');
				}
				extra['duration'] = mins;
			}

			var loc = stations[this.get('start_station')].loc;
			extra.endLoc = stations[this.get('end_station')].loc;
			extra.distance = distance(loc[1], loc[0], extra.endLoc[1], extra.endLoc[0], 'M');
			extra.speed = extra.distance / extra.duration * 60;

			switch (extra.gender) {
				case 'Male':
					extra.gender = 'm';
					break;
				case 'Female':
					extra.gender = 'f';
					break;
			}

			if (extra.start_station == extra.end_station) {
				return new ConversionError('ignoring trip because start_station equal to end_station');
			}

			if (extra.speed > 25) {
				return new ConversionError('ignoring trip because speed seems to high');
			}

			return extra;
		}
		,val: function(doc) {
			return parseFloat(doc.extra.speed);
		}


	}
};
