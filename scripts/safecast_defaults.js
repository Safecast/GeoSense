// Good defaults for Safecast and Earthquakes
o = db.pointcollections.findOne({$or: [{"title" : "Safecast"}, {"title" : "measurements-out.csv"}]});
db.pointcollections.update({_id: o._id}, {$set:
	{
		"title": "Safecast",
		"unit": "cpm",
		"altUnit": ["μSv/h"]
	}
}, false, true);
db.layeroptions.update({_id: o.defaults}, {$set: 
	{
		"visible" : true,
		"featureType" : "C",
		"colors" : [
			{
				"position" : 0,
				"color" : "#0785a8"
			},
			{
				"position" : 0.025,
				"color" : "#ff00ff"
			},
			{
				"position" : 0.25,
				"color" : "#ff1111"
			},
			{
				"position" : 0.5363636363636364,
				"color" : "#ffea00"
			}
		],
		"colorType" : "L"
	}
});
print('Updated Safecast');

o = db.pointcollections.findOne({"title" : /Earthquakes.*/i});
db.pointcollections.update({_id: o._id}, {$set:
	{
		"title": "Earthquakes 1973–2011",
		"unit": "Magnitude" 
	}
}, false, true);
db.layeroptions.update({_id: ObjectId(o.defaults)}, {$set:  
	{
		"visible" : true,
		"featureType" : "B",
		"colors" : [
			{
				"position" : 0,
				"color" : "#00C9FF"
			},
			{
				"position" : 0.21818181818181817,
				"color" : "#7fffd0"
			},
			{
				"position" : 0.475,
				"color" : "#e9ff45"
			}
		],
		"colorType" : "L",
		"opacity" : 0.2,
	}
});
print('Updated Earthquakes');


o = db.pointcollections.findOne({"title" : /Reactors.*/i});
db.pointcollections.update({_id: o._id}, {$set:
	{
		"title": "Nuclear Reactors",
		"unit": "MW" 
	}
}, false, true);
db.layeroptions.update({_id: ObjectId(o.defaults)}, {$set:  
	{
		"visible" : true,
		"featureType" : "P",
		"colors" : [
			{
				"position" : 0,
				"color" : "#bbbbbb"
			},
		],
		"colorType" : "S",
		"opacity" : 0.75,
		"datetimeFormat": '%Y'
	}
});
print('Updated Reactors');


