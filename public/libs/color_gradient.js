/*
ColorGradient by Samuel Luescher <sam at luescher dot org>
Released under MIT License
*/

/**
* Expects an array of objects containing a color and a position, for example:
*
*	[
*		{color: "#FF0000", position: 0.0},
*		{color: "#00FF00", position: 1.0}
*	]
*
*/
var ColorGradient = function(colors) {	
	this.colors = [];
	this.gradientCache = {};
	for (var i = colors.length - 1; i >= 0; i--) {
		this.colors[i] = {
			position: colors[i].position,
			color: parseInt(colors[i].color[0] == '#' ?
				colors[i].color.replace('#', '0x') : colors[i].color)
		};
	}
	// sort by position
	this.colors.sort(function(a, b) { return (a.position - b.position) });
}

ColorGradient.prototype.lerpRGB = function(p, a, b) { 
	// separate R, G, B channels
	var cA = [
		(a &  0xff0000) >> 16,
		(a &  0x00ff00) >> 8,
		(a &  0x0000ff)
	];
	var cB = [
		(b &  0xff0000) >> 16,
		(b &  0x00ff00) >> 8,
		(b &  0x0000ff)
	];
	// lerp and add channels 
	var lerpInt = function(p, a, b) { 
		return Math.round(a + (b - a) * p);
	};
	return (lerpInt(p, cA[0], cB[0]) << 16)
		+ (lerpInt(p, cA[1], cB[1]) << 8)
		+ lerpInt(p, cA[2], cB[2]);
};

ColorGradient.prototype.intColorAt = function(p, step) {

	if (step) {
		p = (p - p % step) / 1;
		/*this.gradientCache[step] = {};
		for (var i = 0.0; i <= 1.0; i += step) {

		}*/
	}

	for (var i = this.colors.length - 1; i > 0; i--) {
		if (this.colors[i].position < p) break;
	}
	var lo = i;
	var hi = i + 1 < this.colors.length ? i + 1 : i;
	var normP = this.colors[hi].position == this.colors[lo].position ? 0.0 :
		(p - this.colors[lo].position) / (this.colors[hi].position - this.colors[lo].position);
	return this.lerpRGB(normP, this.colors[lo].color, this.colors[hi].color);
};

ColorGradient.prototype.colorAt = function(p, step) {
	var zeroPad = function(str, len) {
		return new Array(str.length < len ? len + 1 - str.length : 0).join('0') + str;
	}
	return '#' + zeroPad(this.intColorAt(p, step).toString(16), 6);
};
