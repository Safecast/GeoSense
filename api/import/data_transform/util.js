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

module.exports = {
	getAttr: getAttr,
	setAttr: setAttr
};