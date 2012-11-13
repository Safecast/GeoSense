m = db.maps.findOne({"publicslug" : {$regex: "^safecast.*"}});
if (m) {
	db.maps.remove({_id: m._id});
	print('Deleted map');
}

bindCollections = [];















o = db.pointcollections.findOne({"title" : /Earthquakes.*/i});
if (o) {
	bindCollections.push(o._id);

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
			"visible" : false,
			"featureType" : "B",
			"colors" : [
				{
					"absPosition" : 4.5,
					"color" : "#00C9FF"
				},
				{
					"absPosition" : 5.5,
					"color" : "#7fffd0"
				},
				{
					"absPosition" : 6.5,
					"color" : "#e9ff45"
				}
			],
			"colorType" : "L",
			"opacity" : 0.3,
			"datetimeFormat": "%Y/%m"
		}
	});
	print('Updated Earthquakes');
}

o = db.pointcollections.findOne({$or: [{"title" : "Safecast"}, {"title" : {$regex: "^measurements.*"}}]});
if (o) {
	bindCollections.push(o._id);
	
	db.pointcollections.update({_id: o._id}, {$set:
		{
			"title": "Safecast",
			"description": "Safecast is a global sensor network for collecting and sharing radiation measurements to empower people with data about their environments.",
			"source": "Safecast.org",
			"unit": "cpm",
			"altUnit": ["μSv/h"],
			"sync": true,
			"maxReduceZoom": 17
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
					"color" : "#c55ddb",
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
					"absPosition" : 3500.0,
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
			],
			"datetimeFormat": "%Y/%m/%d"
		}
	};
	db.layeroptions.update({_id: o.defaults}, safecastOptions);

	print('Updated Safecast');
}

o = db.pointcollections.findOne({"title" : /Reactors.*/i});
if (o) {
	bindCollections.push(o._id);

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







o = db.pointcollections.findOne({$or: [{"title" : {$regex: "^glds00ag15.*"}}, {"title" : "Population Density (2000)"}]});
if (o) {
	bindCollections.push(o._id);
	db.pointcollections.update({_id: o._id}, {$set:
		{
			"title": "Population Density (2000)",
			"source": "NASA SEDAC GPWv3",
			"unit": "people/km²",
		}
	}, false, true);

	db.layeroptions.update({_id: ObjectId(o.defaults)}, {$set:  
		{
			visible: false,
			opacity: .4,
			"histogram": false, 
			colors: [
			{
				"color" : "#777777",
				"absPosition" : "1",
				"interpolation" : "",
				"position" : 0
			},
			{
				"color" : "#999999",
				"absPosition" : "5",
				"interpolation" : "",
				"position" : 0
			},
			{
				"color" : "#bbbbbb",
				"absPosition" : "100",
				"interpolation" : "",
				"position" : 0
			},
			{
				"color" : "#dddddd",
				"absPosition" : "1000",
				"interpolation" : "",
				"position" : 0
			},
			{
				"color" : "#ffffff",
				"absPosition" : "15000",
				"interpolation" : "",
				"position" : 0
			},
		]}
	});


	print('Updated Population Density (2000)');
}

o = db.pointcollections.findOne({$or: [{"title" : {$regex: "^glds15ag15.*"}}, {"title" : "Population Density (2015)"}]});
if (o) {
	//bindCollections.push(o._id);
	db.pointcollections.update({_id: o._id}, {$set:
		{
			"title": "Population Density (2015)",
			"source": "NASA SEDAC GPWv3",
			"unit": "people/km²" 
		}
	}, false, true);

	db.layeroptions.update({_id: ObjectId(o.defaults)}, {$set:  
		{
		visible: false,
		opacity: .4,
		"histogram": false, 
		colors: [
			{
				"color" : "#777777",
				"absPosition" : "1",
				"interpolation" : "",
				"position" : 0
			},
			{
				"color" : "#999999",
				"absPosition" : "5",
				"interpolation" : "",
				"position" : 0
			},
			{
				"color" : "#bbbbbb",
				"absPosition" : "100",
				"interpolation" : "",
				"position" : 0
			},
			{
				"color" : "#dddddd",
				"absPosition" : "1000",
				"interpolation" : "",
				"position" : 0
			},
			{
				"color" : "#ffffff",
				"absPosition" : "15000",
				"interpolation" : "",
				"position" : 0
			},
		]}
	});


	print('Updated Population Density (2015)');
}










m = db.maps.findOne({"publicslug" : "safecast"});


m = db.maps.findOne({"publicslug" : {$regex: "^safecast.*"}});

if (!m) {

	var layers = [];
	for (var i = 0; i < bindCollections.length; i++) {
		var optsId = new ObjectId();
		db.layeroptions.insert({_id: optsId});
		layers.push({
			"options" : optsId,
			"pointCollection" : bindCollections[i],
		});
		print("Binding "+db.pointcollections.findOne({_id: bindCollections[i]}).title);
	}

	db.maps.insert({
		"active" : true,
		"adminslug" : "A4jW8vm8BU6T910LHYilCNA",
		"createdAt" : new Date(),
		"createdBy" : null,
		"featured" : 1,
		"initialArea" : {
			"center" : [
				-71.09747432990712,
				42.358959992636834
			],
			"zoom" : 13
		},
		"layers" : layers,
		"modifiedBy" : null,
		"publicslug" : "safecast",
		"status" : "A",
		"title" : "Safecast",
		"description": 'Safecast is a global project working to empower people with data, primarily by mapping environmental data, enabling people to both contribute and freely use the data collected. Through joint efforts with partners such as International Medcom, Keio University, The John S. and James L. Knight Foundation and GlobalGiving, Safecast has been building a radiation sensor network comprised of static and mobile sensors actively deployed in Japan, as well as elsewhere around the world.\n\nSafecast supports the idea that more data – freely available data – is better. This map displays data collected by Safecast volunteers since March 2011. To download this dataset, or for more information about Safecast, <a href="http://blog.safecast.org/about/">please visit the main site</a>.',
		"twitter": "safecast",
		"linkURL": "http://blog.safecast.org/about/",
		"linkTitle": "Safecast website",
		"host" : "map.safecast.org",
		"initialArea" : {
			"center" : [
				140.17260417661612,
				36.94429246653226
			],
			"zoom" : 8
		},
	});
}

m = db.maps.findOne({"publicslug" : {$regex: "^safecast.*"}});
for (var i = 0; i < m.layers.length; i++) {
	var c = db.pointcollections.findOne({_id: m.layers[i].pointCollection});
	var defaultOpts = db.layeroptions.findOne({_id: c.defaults});
	var opts = db.layeroptions.findOne({_id: m.layers[i].options});
	for (var k in defaultOpts) {
		if (k != '_id') {
			opts[k] = defaultOpts[k];
		}
	}
	db.layeroptions.update({_id: opts._id}, opts);
	print('reset options for '+c.title);
}
	


