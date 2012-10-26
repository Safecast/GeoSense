#!/usr/bin/env node

var path = require('path'),
	config = require("./config.js"),
	models = require('./models.js'),
	optimist = require('optimist'),
	API = require('./api/main.js'),
	utils = require('./utils.js'),
	console = require('./ext-console.js');

if (!module.parent) {
	var api = new API();
	var args = optimist.argv,
    	help = 'Usage: node api.js [command] [options]';

	console.log('GeoSense command-line utility');
	
	var runCommand = function(objectId) {
		switch (args._[0]) {
			case 'import':
				var params = utils.deleteUndefined({
					url: args.u || args.url,
					path: args.p || args.path,
					format: args.f || args.format,
					converter: args.c || args.converter,
					append: objectId,
					from: args.from,
					to: args.to,
					max: args.max,
					skip: args.skip,
					incremental: args.incremental,
					bounds: args.bounds
				});
				if (!params.format) {
					var ext = path.extname(params.path || params.url || '').split('.').pop();
					if (ext && ext != '') {
						params.format = ext;
					}
				}

				if ((params.url || params.path) && params.format && utils.connectDB()) {
					api.import.import(params, null, null, utils.exitCallback);
					break;
				}
				utils.exitCallback(false, help);
				break;
			case 'sync':
				var params = utils.deleteUndefined({
					pointCollectionId: objectId,
					url: args.u || args.url,
					path: args.p || args.path,
					format: args.f || args.format,
					converter: args.c || args.converter,
					append: objectId,
					from: args.from,
					to: args.to,
					max: args.max,
					skip: args.skip,
					incremental: args.incremental,
					bounds: args.bounds
				});
				if (params.pointCollectionId && utils.connectDB()) {
					api.import.sync(params, null, null, utils.exitCallback);
					break;
				}
			default:
				utils.exitCallback(false, help);
		}
	}

	if (args._.length > 1 && args._[1][0] != '-') {
		var objectId = args._[1].match(/^[0-9a-f]{24}$/) ?
			args._[1] : null;
		if (objectId) {
			runCommand(objectId);
		} else {
			var title = args._[1];
			utils.connectDB();
			models.PointCollection.findOne({title: title}, function(err, result) {
				if (err) {
					utils.exitCallback(err);
					return;
				}
				if (!result) {
					utils.exitCallback(new Error('PointCollection not found: ' + title));
					return;
				}
				runCommand(result._id.toString());
			});
		}
	} else {
		runCommand();
	}

}

