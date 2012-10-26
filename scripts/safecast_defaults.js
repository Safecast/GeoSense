// Good defaults for Safecast and Earthquakes
o = db.pointcollections.findOne({$or: [{"title" : "Safecast"}, {"title" : {$regex: "^measurements.*"}}]});
if (o) {
	db.pointcollections.update({_id: o._id}, {$set:
		{
			"title": "Safecast",
			"description": "Safecast is a global sensor network for collecting and sharing radiation measurements to empower people with data about their environments.",
			"source": "Safecast.org",
			"unit": "cpm",
			"altUnit": ["μSv/h"],
		}
	}, false, true);
	var safecastOptions = {$set: 
		{
			"visible" : true,
			"featureType" : "C",
			"colors" : [
				{
					"absPosition" : 10,
					"color" : "#0785a8",
					//"interpolation": "threshold",
					"description": "basically no contamination"
				},
				{
					"absPosition" : 100, //0.3 * 350,
					"color" : "#db5dc2",
					"description": "minor contamination"
				},
				{
					"absPosition" : 0.5 * 350,
					"color" : "#ff1111",
					"description": "moderate contamination"
				},
				{
					"absPosition" : 1.0 * 350,
					"color" : "#ff8800",
					"description": "high contamination"
				},
				{
					"absPosition" : 1000, // 3.0 * 350,
					"color" : "#ffdc00",
					"description": "evacuation mandatory"
				},
				{
					"absPosition" : 10.0 * 350,
					"color" : "#ffff88",
					"description": "extremely high contamination"
				}
			],
			"colorType" : "L",
			"cropDistribution" : true,
			"valFormat": [
				{
				},
				{
					"unit": 'μSv/h',
					"eq": '%(val)f/350'
				}
			]
		}
	};
	db.layeroptions.update({_id: o.defaults}, safecastOptions);

	print('Updated Safecast');
}

o = db.pointcollections.findOne({"title" : /Earthquakes.*/i});
if (o) {
	db.pointcollections.update({_id: o._id}, {$set:
		{
			"title": "Earthquakes 1973–2011",
			"description": "A global record of earthquakes with magnitude 4.5 or greater.",
			"source": "USGS/NEIC (PDE) 1973–2011",
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
					"position" : 0.45,
					"color" : "#e9ff45"
				}
			],
			"colorType" : "L",
			"opacity" : 0.3,
		}
	});
	print('Updated Earthquakes');
}


o = db.pointcollections.findOne({"title" : /Reactors.*/i});
if (o) {
	db.pointcollections.update({_id: o._id}, {$set:
		{
			"title": "Nuclear Reactors",
			"source": "World Nuclear Association",
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
}

m = db.maps.findOne({"publicslug" : "safecast"});
if (m) {
	db.maps.update({_id: m._id}, {$set:  
		{
			"description": 'Safecast is a global project working to empower people with data, primarily by mapping environmental data, enabling people to both contribute and freely use the data collected. Through joint efforts with partners such as International Medcom, Keio University, The John S. and James L. Knight Foundation and GlobalGiving, Safecast has been building a radiation sensor network comprised of static and mobile sensors actively deployed in Japan, as well as elsewhere around the world.\n\nSafecast supports the idea that more data – freely available data – is better. This map displays data collected by Safecast volunteers since March 2011. To download this dataset, or for more information about Safecast, <a href="http://blog.safecast.org/about/">please visit the main site</a>.',
			"twitter": "safecast",
			"linkURL": "http://blog.safecast.org/about/",
			"host" : "map.safecast.org",
			"initialArea" : {
				"center" : [
					140.17260417661612,
					36.94429246653226
				],
				"zoom" : 5
			},
		}
	});
	print('Updated Map');
	/*
	for (var i = 0; i < m.layers.length; i++) {
		var c = db.pointcollections.findOne({_id: m.layers[i].pointCollection});
		print(m.layers[i].options);
		var defaultOpts = db.layeroptions.findOne({_id: c.options});
		delete defaultOpts['_id'];
		db.layeroptions.update({_id: m.layers[i].options}, {$set: defaultOpts});
		print('reset options for '+c.title);
	}
	*/
}

o = db.pointcollections.findOne({"title" : {$regex: "^glp00.*"}});
if (o) {
	db.pointcollections.update({_id: o._id}, {$set:
		{
			"title": "Population Count",
			"source": "NASA SEDAC GPWv3 (2000)",
			"unit": "people" 
		}
	}, false, true);
	print('Updated Population Count');
}

o = db.pointcollections.findOne({"title" : {$regex: "^glds.*"}});
if (o) {
	db.pointcollections.update({_id: o._id}, {$set:
		{
			"title": "Population Density",
			"source": "NASA SEDAC GPWv3 (2000)",
			"unit": "people/km²" 
		}
	}, false, true);

	db.layeroptions.update({_id: ObjectId(o.defaults)}, {$set:  
		{colors: [
			{
				"color" : "#00C9FF",
				"absPosition" : "1",
				"interpolation" : "",
				"position" : 0
			},
			{
				"color" : "#81ffff",
				"absPosition" : "5",
				"interpolation" : "",
				"position" : 0
			},
			{
				"color" : "#eaff82",
				"absPosition" : "100",
				"interpolation" : "",
				"position" : 0
			},
			{
				"color" : "#ffa582",
				"absPosition" : "1000",
				"interpolation" : "",
				"position" : 0
			},
			{
				"color" : "#ff0033",
				"absPosition" : "15000",
				"interpolation" : "",
				"position" : 0
			},
		]}
	});


	print('Updated Population Density');
}

o = db.pointcollections.findOne({"title" : {$regex: "^glds00ag.asc"}});
if (o) {
	db.pointcollections.update({_id: o._id}, {$set:
		{
			"title": "Population Density",
			"source": "NASA SEDAC GPWv3 (2000)",
			"unit": "people/km²" 
		}
	}, false, true);

	db.layeroptions.update({_id: ObjectId(o.defaults)}, {$set:  
		{colors: [
			{
				"color" : "#00C9FF",
				"absPosition" : "1",
				"interpolation" : "",
				"position" : 0
			},
			{
				"color" : "#81ffff",
				"absPosition" : "5",
				"interpolation" : "",
				"position" : 0
			},
			{
				"color" : "#eaff82",
				"absPosition" : "100",
				"interpolation" : "",
				"position" : 0
			},
			{
				"color" : "#ffa582",
				"absPosition" : "1000",
				"interpolation" : "",
				"position" : 0
			},
			{
				"color" : "#ff0033",
				"absPosition" : "15000",
				"interpolation" : "",
				"position" : 0
			},
		]}
	});


	print('Updated Population Density');
}

o = db.pointcollections.findOne({"title" : {$regex: "^glarea.*"}});
if (o) {
	db.pointcollections.update({_id: o._id}, {$set:
		{
			"title": "Land Area",
			"source": "NASA SEDAC GPWv3 (2000)",
			"unit": "km²" 
		}
	}, false, true);
	print('Updated Land Area');
}