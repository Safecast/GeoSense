/*
These methods may be used under MongoDB natively, for instance when 
performing a MapReduce operation. Since MongoDB does not have these
methods, you would need to emulate them and supply them as Code
objects under the ``scope`` argument. 
*/
var isArray = Array.isArray,
    arrayReduce = Array.prototype.reduce;

/*
Arithmetic overflow for val so that -max <= val < max.
*/
var overflow = function(val, max) 
{ 
    var dmax = 2 * max,
        mod = val % dmax; 
    return mod < -max ? 
        mod + dmax 
    : mod >= max ? mod - dmax 
        : mod; 
};

/*
Returns [x,y] so that both coordinates are >= -180 and < 180, 
suitable for MongoDB 2d indexes (now deprecated).
*/
var coordinates2d = function(x, y) 
{
    var c = isArray(x) ? x : [x,y];
    return [overflow(c[0], 180), overflow(c[1], 90)];
};

/*
Gets bounding box [[west, south], [east, north]] for coordinates, which can
be a n-dimensional array of coordinates, such as [11,12] or 
[[[11,12],[13,14]]] etc.
*/
var getBounds = function(coordinates, returnPoint) 
{
    if (!isArray(coordinates) || !coordinates.length) {
        return;
    } else if (!isArray(coordinates[0])) {
        coordinates = [coordinates];
    }
    var dimensions = 0;
    var bounds = arrayReduce.call(coordinates, function(a, b) {
        if (!isArray(b)) return a;
        var bmax, bmin;
        if (isArray(b[0])) {
            b = getBounds(b);
            bmin = b[0];
            bmax = b[1];
        } else {
            bmax = bmin = b;
        }
        if (bmin.length < 2 || bmax.length < 2) return a;
        /*if (overflow180) {
            bmin = coordinates2d(bmin); bmax = coordinates2d(bmax);
        }*/
        var ret = [[],[]];
        dimensions = Math.max(dimensions, b.length);
        for (var i = dimensions - 1; i >= 0; i--) {
            ret[0][i] = Math.min(bmin[i], a[0][i]);
            ret[1][i] = Math.max(bmax[i], a[1][i]);
        }
        return ret;
        /*return [
            [Math.min(bmin[0], a[0][0]), Math.min(bmin[1], a[0][1])],
            [Math.max(bmax[0], a[1][0]), Math.max(bmax[1], a[1][1])]
        ];*/
    }, [[Infinity, Infinity, Infinity], [-Infinity, -Infinity, -Infinity]]);
    if (returnPoint && bounds[0][0] == bounds[1][0] && bounds[0][1] == bounds[1][1]) {
        return bounds[0];
    }
    return bounds;
};

var bboxFromBounds = function(bounds)
{
    return arrayReduce.call(bounds, function(a, b) {
        return a.concat(b);
    }, []);
};

var boundsFromBbox = function(bbox)
{
    var l = bbox.length;
    return [bbox.slice(0, l / 2), bbox.slice(l / 2)];
};

var getCenter = function(bounds)
{
    return [
        bounds[0][0] + (bounds[1][0] - bounds[0][0]) / 2,
        bounds[0][1] + (bounds[1][1] - bounds[0][1]) / 2
    ];
}

var polygonFromBbox = function(b)
{
    return {
        type: 'Polygon',
        coordinates: [[
            [b[0], b[1]],
            [b[2], b[1]],
            [b[2], b[3]],
            [b[0], b[3]],
            [b[0], b[1]]
        ]]
    };
}

var polygonFromBounds = function(b)
{
    return {
        type: 'Polygon',
        coordinates: [[
            b[0],
            [b[1][0], b[0][1]],
            [b[1][0], b[1][1]],
            [b[0][0], b[1][1]],
            b[0]
        ]]
    };
}

module.exports = {
    overflow: overflow,
    coordinates2d: coordinates2d,
    getBounds: getBounds,
    bboxFromBounds: bboxFromBounds,
    boundsFromBbox: boundsFromBbox,
    polygonFromBbox: polygonFromBbox,
    polygonFromBounds: polygonFromBounds
};

