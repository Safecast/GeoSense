function formatLargeNumber(c) {
	if (c > 1000000) {
		c = Math.round(c / 1000000 * 10) / 10 + 'M';
	} else if (c > 1000) {
		c = Math.round(c / 1000) + 'K';
	}
	return c;
}

function formatDecimalNumber(c, decimalPlaces) {
	if (c < 10) {
		if (decimalPlaces == null) {
			decimalPlaces = c < .1 ? 2 : 1;
		}
		var f = Math.pow(10, decimalPlaces);
		return Math.round(c * f) / f;
	}
	return Math.round(c);
}

function getURLParameter(paramName) {
  var searchString = window.location.search.substring(1),
      i, val, params = searchString.split("&");

  for (i=0;i<params.length;i++) {
    val = params[i].split("=");
    if (val[0] == paramName) {
      return unescape(val[1]);
    }
  }
  return null;
}

function genQueryString(params, name) {
	var url = '';
	if (params instanceof Array) {
		for (var i = 0; i < params.length; i++) {
			url += (url != '' ? '&' : '') + name + '=' + params[i];
		}
	} else {
		for (var name in params) {
			if (params[name] instanceof Array) {
				url += (url != '' ? '&' : '') + genQueryString(params[name], name);
			} else {
				url += (url != '' ? '&' : '') + name + '=' + params[name];
			}
		}
	}
	return url;
}

$.fn.updateFeedback = function() {
	this.each(function() {
		$(this).tempGlow({
			textColor: '#00C9FF',
			haloColor: '#008cbf',
			duration: 1000
		});
	});
};

$.fn.blink = function() {
	var cycle;
	(cycle = function() {
	   progressElement.delay(1000)
	        .animate({opacity: 1}, 'slow')
	        .delay(1000)
	        .animate({opacity: .2}, 'slow', cycle);
	})();
};

var lpad = function(str, padString, length) {
	var s = new String(str);
    while (s.length < length) {
        s = padString + s;
    }
    return s;
};

/**
* Simple Python-style string formatting.
*
* Example:
*
*	"%(foo)s, %(bar)s!".format({foo: 'Hello', bar: 'world'})
*/
String.prototype.format = function(replacements) {
	return this.replace(/\%\(([a-z0-9_]+)\)(s|i)/ig, function(match, name, type) { 
		return typeof replacements[name] != 'undefined'
			? replacements[name]
			: match;
	});
};

function __(str, replacements) {
	var s = (locale.strings[str] || str);
	if (replacements) {
		return s.format(replacements);
	}
	return s;
}

/**
* Simple Python-style date formatting.
*
* Example:
*
*	new Date().format('%d %m %y')
*/
Date.prototype.format = function(format) {
  var self = this;
  return format.replace(/\%([a-z0-9_]+)/ig, function(match, name, type) { 
    return typeof self.formatReplacements[name] != 'undefined'
      ? self.formatReplacements[name].call(self)
      : match
    ;
  });
};

Date.prototype.formatReplacements = {
  	d: function() {
  		return lpad(this.getDate(), '0', 2);
  	},
  	m: function() {
  		return lpad(this.getMonth(), '0', 2);
  	},
  	Y: function() {
  		return this.getFullYear();
  	},
  	y: function() { 
  		return new String(this.getFullYear()).substr(2, 2);
  	},
  	B: function() { 
  		return locale.MONTH_NAMES[this.getMonth()] 
  	},
  	b: function() { 
  		return locale.ABBR_MONTH_NAMES[this.getMonth()] 
  	}
};
