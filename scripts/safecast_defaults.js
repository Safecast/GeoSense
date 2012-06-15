// Good defaults for Safecast and Earthquakes
o = db.pointcollections.findOne({"title" : "Safecast"});
db.pointcollections.update({_id: o._id}, {$set:
	{
		"unit": "μSv/h",
		"altUnit": ["cpm"]
	}
});
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

o = db.pointcollections.findOne({"title" : /Earthquakes.*/});
db.pointcollections.update({_id: o._id}, {$set:
	{
		"title": "Earthquakes 1973–2011",
		"unit": "Richter mag." 
	}
});
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
		"opacity" : 0.2
	}
});
print('Updated Earthquakes');


