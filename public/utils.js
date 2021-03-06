define(['jquery', 'views/notification-bubble-view'], function($, NotificationBubbleView) {
	return {
		initAjaxErrorNotification: function() {
			$(document).ajaxError(function(event, jqxhr, settings, thrownError) {
				var message = 'A network error occured. Please try again later.';
				if (jqxhr && jqxhr.responseText && jqxhr.responseText != '') {
					message = jqxhr.responseText;
					try {
						var parsed = $.parseJSON(jqxhr.responseText);
						if (parsed.message) {
							message = parsed.message;
						}
					} catch (e) {
						// noop
					}
				} else if (thrownError && thrownError != '') {
					message = thrownError;	
				}
				console.error(thrownError);
				NotificationBubbleView.error(message);
			});		
		}
	};
});

/*
Returns an attribute of an object by path in dot notation.
Example:
	
	getAttr({hello: {world: 'Hello World!'}}, 'hello.world') // ==> 'Hello World!'

*/
var getAttr = function(obj, path) {
	var _get = function(obj, pathSegments) {
		if (!obj) return undefined;
		var el = obj[pathSegments.shift()];
		if (!pathSegments.length) return el;
		return _get(el, pathSegments);
	};
	return _get(obj, path.split('.'));
};

/*
Sets an attribute of an object by path in dot notation.
Example:
	
	setAttr(obj, 'some.path', 'value') // ==> {some: {path: 'value'}}

*/
var setAttr = function(obj, path, value) {
	var _set = function(obj, pathSegments) {
		if (pathSegments.length == 1) {
			obj[pathSegments[0]] = value;
			return;
		}
		var seg = pathSegments.shift();
		if (obj[seg] == undefined) {
			obj[seg] = {};
		}
		_set(obj[seg], pathSegments);
	};
	_set(obj, path.split('.'));
};

var expandObj = function(obj) {
	var retObj = {};
	for (var k in obj) {
		setAttr(retObj, k, obj[k]);
	}
	return retObj;
};

function formatLargeNumber(c) {
	if (c >= 1000000) {
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
	return ('<p>' + str.split(/(\s*\n\s*){2,}/).join('</p><p>') + '</p>');
}

$.fn.uiToggle = function(opts) {
	var opts = opts || {},
		inactive = true;

	if (opts.duration == undefined) {
		opts.duration = 'fast';
	}

	var ret = this.each(function() {
		var visible = this;
		$(this).slideToggle(opts);
		inactive = inactive && $._data(this, 'fxshow') && $._data(this, 'fxshow').hidden;					
	});
	if (!inactive && opts.show) {
		opts.show();
	}
	if (opts.activate) {
		$(opts.activate).toggleClass(
			opts.activeClass || 'active', !inactive);
	}
	return ret;
}

/*
$.fn.updateFeedback = function() {
	return this.each(function() {
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
*/

var lpad = function(str, padString, length) {
	var s = new String(str);
	while (s.length < length) {
		s = padString + s;
	}
	return s;
};

function mathEval(exp) {
	var reg = /(?:[a-z$_][a-z0-9$_]*)|(?:[;={}\[\]"'!&<>^\\?:])/ig,
		valid = true;

	// Detect valid JS identifier names and replace them
	var evalExp = exp.replace(reg, function ($0) {
		// If the name is a direct member of Math, allow
		if (Math.hasOwnProperty($0))
			return "Math."+$0;
		// Otherwise the expression is invalid
		else
			valid = false;
	});

	// Don't eval if our replace function flagged as invalid
	if (!valid) {
		var msg = "Invalid arithmetic expression: "+exp;
		console.error(msg);
		if (DEV) throw new Error(msg);
		return false;
	} else {
		try { 
			return(eval(evalExp)); 
		} catch (e) { 
			var msg = "Eval error: " + evalExp;
			console.error(msg);
			if (DEV) throw e;
			return false;
		};
	}
}

function ValFormatter(format)
{
	this.eq = format.eq;
	this.formatStr = format.formatStr;
	this.unit = format.unit;
}

ValFormatter.prototype.convert = function(val)
{
	var v = val;	
	if (this.eq && this.eq != '') {
		var eq = this.eq.format({
			'val': v
		});
		v = mathEval(eq);
	}
	return v;
}

ValFormatter.prototype.format = function(val)
{
	var v = this.convert(val);
	if (this.formatStr) {
		return this.formatStr.format({
			'val': v
		});
	}
	return autoFormatNumber(v);
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
		return typeof replacements[name] == 'function' ? replacements[name].apply(this) : typeof replacements[name] != 'undefined'
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

function zeroPad(str, len) {
	return new Array(str.length < len ? len + 1 - str.length : 0).join('0') + str;
}

function getRGBChannels(color)
{
	var intColor = colorToInt(color);
	return channels = [
		(intColor &  0xff0000) >> 16,
		(intColor &  0x00ff00) >> 8,
		(intColor &  0x0000ff)
	];
}

function rgb2int (rgb) {
	return rgb[0] << 16 ^ rgb[1] << 8 ^ rgb[2];
}

function colorToInt(color)
{
	return typeof color == 'string' ? parseInt(color.replace('#', '0x')) : color;
}

function intToColor(intColor)
{
	return '#' + zeroPad(intColor.toString(16), 6);
}

function multRGB(color, factor) {
	var intColor = colorToInt(color),
		channels = getRGBChannels(intColor);
	for (var i = channels.length - 1; i >= 0; i--) {
		channels[i] = Math.min(255, Math.round(channels[i] * factor));
	}
	intColor = (channels[0] << 16)
			+ (channels[1] << 8)
			+ channels[2];	
	return intToColor(intColor);
}

function rgb2hsb(_rgb) {
	var x, f, i, hue, sat, val;
	var rgb = [_rgb[0]/255, _rgb[1]/255, _rgb[2]/255];
	x = Math.min(Math.min(rgb[0], rgb[1]), rgb[2]);
	val = Math.max(Math.max(rgb[0], rgb[1]), rgb[2]);
	if (x==val){
	return(new Array(0,0,val));
	}
	f = (rgb[0] == x) ? rgb[1]-rgb[2] : ((rgb[1] == x) ? rgb[2]-rgb[0] : rgb[0]-rgb[1]);
	i = (rgb[0] == x) ? 3 : ((rgb[1] == x) ? 5 : 1);
	hue = Math.floor((i-f/(val-x))*60)%360;
	sat = (val-x)/val;
	val = val;
	return(new Array(hue,sat,val));
}

function hsb2rgb(_hsb) {
	var red, grn, blu, i, f, p, q, t;
	var hsb = [_hsb[0], _hsb[1], _hsb[2]];
	hsb[0]%=360;
	if(hsb[2]==0) {return(new Array(0,0,0));}
	hsb[0]/=60;
	i = Math.floor(hsb[0]);
	f = hsb[0]-i;
	p = hsb[2]*(1-hsb[1]);
	q = hsb[2]*(1-(hsb[1]*f));
	t = hsb[2]*(1-(hsb[1]*(1-f)));
	if (i==0) {red=hsb[2]; grn=t; blu=p;}
	else if (i==1) {red=q; grn=hsb[2]; blu=p;}
	else if (i==2) {red=p; grn=hsb[2]; blu=t;}
	else if (i==3) {red=p; grn=q; blu=hsb[2];}
	else if (i==4) {red=t; grn=p; blu=hsb[2];}
	else if (i==5) {red=hsb[2]; grn=p; blu=q;}
	red = Math.floor(red*255);
	grn = Math.floor(grn*255);
	blu = Math.floor(blu*255);
	return (new Array(red,grn,blu));
}

function circleToGeoJSON(ctr, xRadius, yRadius, numSegments, internalProjection, externalProjection)
{
	var corners = [];
	var step = 2 * Math.PI / numSegments;
	for (var i = 0; i < Math.PI * 2; i += step) {
		var x = ctr.x + Math.cos(i) * xRadius,
			y = ctr.y + Math.sin(i) * yRadius;
		if (internalProjection && externalProjection) {
			var pt = new OpenLayers.Geometry.Point(x, y);
			pt.transform(internalProjection, externalProjection);
			x = pt.x; y = pt.y;
		}
		corners.push([x, y]);
	}
	corners.push(corners[0]);
	return {
		type: 'LineString',
		coordinates: corners
	};
}

if (!Array.isArray) {
  Array.isArray = function (vArg) {
	return Object.prototype.toString.call(vArg) === "[object Array]";
  };
}

function maxWords(str, max) {
	var words = str.split(' ');
	if (words.length > max) {
		return words.splice(0, max).join(' ') + '…';
	}
	return str;
}