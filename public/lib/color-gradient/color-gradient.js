/*
ColorGradient by Samuel Luescher <sam at luescher dot org>
Released under MIT License
*/
define([], function() {
	/*
	* Expects an array of objects containing a color and a position, for example:
	*
	*	[
	*		{color: "#FF0000", position: 0.0},
	*		{color: "#00FF00", position: 1.0}
	*	]
	*
	*/
	var ColorGradient = function(colors, options) {	
		this.colors = [];
		this.gradientCache = {};
		var options = options || {};
		if (colors) {
			for (var i = colors.length - 1; i >= 0; i--) {
				var intColor = parseInt(colors[i].color[0] == '#' ?
					colors[i].color.replace('#', '0x') : colors[i].color);
				var p = parseFloat(colors[i].position);
				this.colors[i] = {
					position: colors[i].position,
					// convert color strings to int
					color: intColor,
					interpolation: options.interpolation || colors[i].interpolation,
					// split channels of color
					channels: this.getChannels(intColor)
				};
			}
		}
		// sort by position
		this.colors.sort(function(a, b) { return (a.position - b.position) });
	}

	ColorGradient.prototype.getChannels = function(intColor) {
		return [
			(intColor &  0xff0000) >> 16,
			(intColor &  0x00ff00) >> 8,
			(intColor &  0x0000ff)
		];
	}

	/*
	* Returns linear interpolation of integers a and b at position p between 0.0 and 1.0.
	*/
	var lerpInt = function(p, a, b) { 
		return Math.round(a + (b - a) * p);
	};

	ColorGradient.prototype.interpolation = {
		// returns result of linear interpolation between two colors
		lerpRGB: function(p, a, b) { 
			// separate R, G, B channels
			var cA = a.channels || ColorGradient.prototype.getChannels(a.color);
			var cB = b.channels || ColorGradient.prototype.getChannels(b.color);
			// lerp and add channels 
			return (lerpInt(p, cA[0], cB[0]) << 16)
				+ (lerpInt(p, cA[1], cB[1]) << 8)
				+ lerpInt(p, cA[2], cB[2]);
		},
		// returns lower color, using positions as threshold values
		threshold: function(p, a, b) {
			return p < 1 ? a.color : b.color;
		}
	};

	ColorGradient.prototype.interpolation.default = 'lerpRGB';

	/*
	* Returns integer color for gradient at position p between 0.0 and 1.0 with an 
	* optional step parameter for non-smooth (but cacheable) gradients.
	*/ 
	ColorGradient.prototype.intColorAt = function(p, step) {
		if (step) {
			p = (p - p % step) / 1;
			if (!this.gradientCache[step]) {
				this.gradientCache[step] = {};
			} else if (this.gradientCache[step][p] != null) {
				return this.gradientCache[step][p];
			}
		}

		for (var i = this.colors.length - 1; i > 0; i--) {
			if (this.colors[i].position < p) break;
		}
		var lo = i;
		var hi = i + 1 >= this.colors.length || this.colors[lo].position > p ? i : i + 1;

		var normP = this.colors[hi].position == this.colors[lo].position ? 0.0 :
			(p - this.colors[lo].position) / (this.colors[hi].position - this.colors[lo].position);
		
		var interpolation = this.colors[lo].interpolation;
		if (!interpolation) {
			f = this.interpolation[this.interpolation.default];
		} else {
			f = this.interpolation[interpolation];
		}
		var intColor = f(normP, this.colors[lo], this.colors[hi]);

		if (step) {
			this.gradientCache[step][p] = intColor;
		}

		return intColor;
	};

	ColorGradient.prototype.zeroPad = function(str, len) {
		return new Array(str.length < len ? len + 1 - str.length : 0).join('0') + str;
	}

	ColorGradient.prototype.intToHexColor = function(intColor) {
		return '#' + this.zeroPad(intColor.toString(16), 6);
	}

	/*
	* Returns hex color for gradient at position p between 0.0 and 1.0 with an 
	* optional step parameter for non-smooth (but cacheable) gradients.
	*/ 
	ColorGradient.prototype.colorAt = function(p, step) {
		return this.intToHexColor(this.intColorAt(p, step));
	};

	return ColorGradient;
});
