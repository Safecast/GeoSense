var utils = require('../../utils.js');

var lpad = function(str, padString, length) {
	var s = new String(str);
    while (s.length < length) {
        s = padString + s;
    }
    return s;
};

// Returns the week number for this date.  dowOffset is the day of week the week.
// "starts" on for your locale - it can be from 0 to 6. If dowOffset is 1 (Monday),
// the week returned is the ISO 8601 week number.
// @param int dowOffset
// @return int
var getWeek = function(date, dowOffset) {
	dowOffset = typeof(dowOffset) == 'int' ? dowOffset : 0; //default dowOffset to zero
	var newYear = new Date(date.getFullYear(),0,1);
	var day = newYear.getDay() - dowOffset; //the day of week the year begins on
	day = (day >= 0 ? day : day + 7);
	var daynum = Math.floor((date.getTime() - newYear.getTime() - 
		(date.getTimezoneOffset()-newYear.getTimezoneOffset()) * 60000) / 86400000) + 1;
	var weeknum;
	//if the year starts before the middle of a week
	if(day < 4) {
		weeknum = Math.floor((daynum+day-1)/7) + 1;
		if(weeknum > 52) {
			nYear = new Date(date.getFullYear() + 1,0,1);
			nday = nYear.getDay() - dowOffset;
			nday = nday >= 0 ? nday : nday + 7;
			/*if the next year starts before the middle of
 			  the week, it is week #1 of that year*/
			weeknum = nday < 4 ? 1 : 53;
		}
	}
	else {
		weeknum = Math.floor((daynum+day-1)/7);
	}
	return weeknum;
};

var clamp180 = function(deg) {
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

var MapReduceKey = {
	Copy: function() {
		this.get = function(value) {
			return value;
		};
		return this;
	},
	Daily: function(t) {
		this.get = function(t) {
			return [
				t.getFullYear()+''+lpad(t.getMonth(), '0', 2)+''+lpad(t.getUTCDate(), '0', 2),
				new Date(t.getFullYear(), t.getMonth(), t.getUTCDate())
			];	
		};
		this.name = 'daily';
		this.index = function(collection, field_name) {
			var index = {};
			index[field_name] = 1;
			collection.ensureIndex(index, function() {});
			//return (utils.collectionHasIndex(collection, index));
			return true;
		};
		return this;
	},
	Weekly: function(t) {
		this.get = function(t) {
			var week = getWeek(t, 1);
			var day = t.getDay(),
		      diff = t.getDate() - day + (day == 0 ? -6 : 1);
			t.setDate(diff);
			return [
				t.getFullYear() + '' + lpad(week, '0', 2),
				new Date(t.getFullYear(), t.getMonth(), t.getUTCDate())
			];
		};
		this.name = 'weekly';
		this.index = function(collection, field_name) {
			var index = {};
			index[field_name] = 1;
			collection.ensureIndex(index, function() {});
			//return (utils.collectionHasIndex(collection, index));
			return true;
		};
		return this;
	},
	Yearly: function(t) {
		this.get = function(t) {
			return [
				t.getFullYear(),
				new Date(t.getFullYear(), 0, 1)
			];
		};
		this.name = 'yearly';
		this.index = function(collection, field_name) {
			var index = {};
			index[field_name] = 1;
			collection.ensureIndex(index, function() {});
			//return (utils.collectionHasIndex(collection, index));
			return true;
		};
		return this;
	},

	LocGrid: function(grid_size) {
		this.grid_size = grid_size;
		this.get = function(loc) {
			var grid_size = this.grid_size;
			if (!loc || isNaN(parseFloat(loc[0])) || isNaN(parseFloat(loc[1]))) return;

			loc[0] = clamp180(loc[0]);
			loc[1] = clamp180(loc[1]);

			if (grid_size) {
				var grid_lng = Math.round((loc[0] - loc[0] % grid_size) / grid_size);
				var grid_lat = Math.round((loc[1] - loc[1] % grid_size) / grid_size);
				var loc = [grid_lng * grid_size + grid_size / 2, grid_lat * grid_size + grid_size / 2];
				loc[0] = clamp180(loc[0]);
				loc[1] = clamp180(loc[1]);
			} else {
				var grid_lng = loc[0];
				var grid_lat = loc[1];
			}

			return [
				grid_lng + ',' + grid_lat + ',' + grid_size, 
				loc
			];
		};
		this.name = 'loc-'+this.grid_size;
		this.index = function(collection, field_name) {
			var index = {};
			index[field_name] = '2d';
			collection.ensureIndex(index, function() {});
			//return (utils.collectionHasIndex(collection, index));
			return true;
		};
		return this;
	},

	Histogram: function(min, max, steps) {
		this.step = (max - min) / steps;
		this.steps = steps;
		this.min = min - min % this.step;
		this.max = max - max % this.step;
		this.get = function(val) {
			var stepVal = val - val % this.step;
			return [
				stepVal, 
				{x: Math.round((stepVal - this.min) / this.step)}
			];
		};
		this.name = 'hist-'+steps;
	}
};

module.exports = {
	MapReduceKey: MapReduceKey,
	scopeFunctions: {
		lpad: lpad,
		clamp180: clamp180,
		getWeek: getWeek
	}
};