function objectIdInArray(objectId, arr) {
	for (var i = 0; i < arr.length; i++) {
		if (objectId.toString() == arr[i].toString()) {
			return true;
		}
	}
	return false;
}

var maps = db.maps.find();
var usedCollections = [];
for (var i = 0; i < maps.length(); i++) {
	print('* map: ' + maps[i].title);
	for (var j = 0; j < maps[i].layers.length ; j++) {
		usedCollections.push(maps[i].layers[j].pointCollection);
		var c = db.pointcollections.findOne({_id: maps[i].layers[j].pointCollection});
		print('  * collection: ' + c.title);
		if (c.linkedPointCollection) {
			if (!objectIdInArray(c.linkedPointCollection, usedCollections)) {
				usedCollections.push(c.linkedPointCollection);
				var c = db.pointcollections.findOne({_id: c.linkedPointCollection});
				print('  * linked collection: ' + c.title);
			}
		}
	}
}
print('* collections: ' + usedCollections.length);


var c = db.pointcollections;
var ninQuery = {'_id': {$nin: usedCollections}};
print('* unused collections: ' + c.count(ninQuery));
print('REMOVING...');
c.remove(ninQuery);



var c = db.points;
var inQuery = {'pointCollection': {$in: usedCollections}};
var ninQuery = {'pointCollection': {$nin: usedCollections}};
print('* total points: ' + c.count());
print('* used points: ' + c.count(inQuery));
print('* unused points: ' + c.count(ninQuery));
print('REMOVING...');
c.remove(ninQuery);

var inQuery = {'value.pointCollection': {$in: usedCollections}};
var ninQuery = {'value.pointCollection': {$nin: usedCollections}};
for (var k in config.GRID_SIZES) {
	print('* grid size: ' + config.GRID_SIZES[k]);
	var c = db['r_points_loc-' + config.GRID_SIZES[k]]
	print('  * total points: ' + c.count());
	print('  * used points: ' + c.count(inQuery));
	print('  * unused points: ' + c.count(ninQuery));
	print('  REMOVING...');
	c.remove(ninQuery);
}
