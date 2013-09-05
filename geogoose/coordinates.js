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
suitable for MongoDB 2d indexes.
*/
var coordinates2d = function(x, y) 
{
    var c = isArray(x) ? x : [x,y];
    return [overflow(c[0], 180), overflow(c[1], 180)];
};

/*
Gets bounding box [[west, south], [east, north]] for coordinates, which can
be a n-dimensional array of coordinates, such as [11,12] or 
[[[11,12],[13,14]]] etc.

If the second parameter is true, the final coordinates will be overflown
so that they are >= -180 and < 180, suitable for MongoDB 2d indexes.
*/
var getBounds = function(coordinates, overflow180, returnPoint) 
{
    if (!isArray(coordinates) || !coordinates.length) {
        return;
    } else if (!isArray(coordinates[0])) {
        coordinates = [coordinates];
    }
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
        if (overflow180) {
            bmin = coordinates2d(bmin); bmax = coordinates2d(bmax);
        }
        return [
            [Math.min(bmin[0], a[0][0]), Math.min(bmin[1], a[0][1])],
            [Math.max(bmax[0], a[1][0]), Math.max(bmax[1], a[1][1])]
        ];
    }, [[Infinity, Infinity], [-Infinity, -Infinity]]);
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

/*
Mongo currently doesn't handle the transition around the dateline (x = +-180)
Thus, if the bounds contain the dateline, we need to query for the box to 
the left and the box to the right of it. 
*/
var adjustBboxForQuery = function(b)
{
    if (b[0] < -180) {
        boxes = [
            [[180 + b[0] % 180, b[1]], [179.9999999999999, b[3]]],
            [[-180, b[1]], [b[2], b[3]]]
        ];
    } else if (b[2] > 180) {
        boxes = [
            [[b[0], b[1]], [179.9999999999999, b[3]]],
            [[-180, b[1]], [-180 + b[2] % 180, b[3]]]
        ];
    } else if (b[0] > b[2]) {
        boxes = [
            [[b[0], b[1]], [179.9999999999999, b[3]]],
            [[-180, b[1]], [b[2], b[3]]]
        ];
    } else {
        boxes = [
            [[b[0], b[1]], [b[2], b[3]]]
        ];
    }
    return boxes;
}

module.exports = {
    overflow: overflow,
    coordinates2d: coordinates2d,
    getBounds: getBounds,
    bboxFromBounds: bboxFromBounds,
    boundsFromBbox: boundsFromBbox,
    adjustBboxForQuery: adjustBboxForQuery
};

