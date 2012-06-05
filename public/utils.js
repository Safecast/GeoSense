function formatLargeNumber(c) {
	if (c > 1000000) {
		c = Math.round(c / 1000000 * 10) / 10 + 'M';
	} else if (c > 1000) {
		c = Math.round(c / 1000) + 'K';
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
