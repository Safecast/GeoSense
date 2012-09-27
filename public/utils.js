function formatLargeNumber(c) {
	if (c > 1000000) {
		c = Math.round(c / 1000000 * 10) / 10 + 'M';
	} else if (c > 5000) {
		c = Math.round(c / 1000) + 'K';
	} else if (c > 1000) {
		return parseInt(c);
	}
	return c;
}

function formatDecimalNumber(c, decimalPlaces) {
	if (c < 10) {
		if (decimalPlaces == null) {
			decimalPlaces = 2;
		}
		var f = Math.pow(10, decimalPlaces);
		return Math.round(c * f) / f;
	}
	return Math.round(c);
}

function autoFormatNumber(c)
{
	if (c > 1000) {
		return formatLargeNumber(c);
	} else if (c % 1 != 0) {
		return formatDecimalNumber(c);
	}
	return c;
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

function nl2p(str)
{
	str = '<p>' + str.replace(/(\s*\n\s*){2}/, '</p><p>') + '</p>';
	str = str.replace(/(\s*\n\s*){1}/, '<br />');
	return str;
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

function mathEval (exp) {
    var reg = /(?:[a-z$_][a-z0-9$_]*)|(?:[;={}\[\]"'!&<>^\\?:])/ig,
        valid = true;

    // Detect valid JS identifier names and replace them
    exp = exp.replace(reg, function ($0) {
        // If the name is a direct member of Math, allow
        if (Math.hasOwnProperty($0))
            return "Math."+$0;
        // Otherwise the expression is invalid
        else
            valid = false;
    });

    // Don't eval if our replace function flagged as invalid
    if (!valid) {
        console.log("Invalid arithmetic expression");
    	return false;
    } else {
        try { return(eval(exp)); } catch (e) { console.log("Invalid arithmetic expression"); return false; };
    }
}

function ValFormatter(format)
{
	this.eq = format.eq;
	this.formatStr = format.formatStr;
	this.unit = format.unit;
}

ValFormatter.prototype.format = function(val)
{
	if (this.eq) {
		var eq = this.eq.format({
			'val': val
		});
		val = mathEval(eq);
	}
	if (this.formatStr) {
		return this.formatStr.format({
			'val': val
		});
	}
	return autoFormatNumber(val);
}

/**
* Simple Python-style string formatting.
*
* Example:
*
*	"%(foo)s, %(bar)s!".format({foo: 'Hello', bar: 'world'})
*/
String.prototype.format = function(replacements) {
	return this.replace(/\%\(([a-z0-9_]+)\)([sif])/ig, function(match, name, type) { 
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

function zeroPad(str, len) {
	return new Array(str.length < len ? len + 1 - str.length : 0).join('0') + str;
}

function multRGB(color, factor) {
	var intColor = parseInt(color.replace('#', '0x'));
	var channels = [
		(intColor &  0xff0000) >> 16,
		(intColor &  0x00ff00) >> 8,
		(intColor &  0x0000ff)
	];
	for (var i = channels.length - 1; i >= 0; i--) {
		channels[i] = Math.min(255, Math.round(channels[i] * factor));
	}
	intColor = (channels[0] << 16)
			+ (channels[1] << 8)
			+ channels[2];	
	return '#' + zeroPad(intColor.toString(16), 6);
}

function wktCircle(ctr, xRadius, yRadius, numSegments)
{
	var corners = [];
    var step = 2 * Math.PI / numSegments;
    for (var i = 0; i < Math.PI * 2; i += step) {
        corners.push((ctr.x + Math.cos(i) * xRadius) + ' ' + (ctr.y + Math.sin(i) * yRadius));
    }
    return 'POLYGON((' + corners.join(', ') + '))';
}

function genMapURI(mapInfo, mapViewName, opts, admin, slugField)
{
	var uri = (admin ? '/admin' : '') 
		+ (slugField ? '/' + mapInfo[slugField] : '') 
		+ (mapViewName && mapViewName != '' ? '/' + mapViewName : '');
	
	if (opts) {
    	if (opts.x != undefined && opts.y != undefined) {
	    	uri += '/%(x)s,%(y)s';
	    	if (opts.zoom != undefined) {
	    		uri += ',%(zoom)s';
	    	}
    	}
	}
	return uri.format(opts);
}

function genMapURL(mapInfo, opts, admin)
{
	var customHost = !DEV && !admin && mapInfo.host && mapInfo.host != '';
	if (customHost) {
		var baseUrl = 'http://' + mapInfo.host;
	} else {
		var baseUrl = BASE_URL;
	}
	return baseUrl + genMapURI(mapInfo, opts ? opts.mapViewName : null, opts, admin, customHost ? false : (!admin ? 'publicslug' : 'adminslug'));
};

