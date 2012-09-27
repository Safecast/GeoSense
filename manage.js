#!/usr/bin/env node

var config = require("./config.js"),
	mongoose = require('mongoose'),
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
	
	var connect = function() {
		console.info('*** connecting to db ***', config.DB_PATH);
		return mongoose.connect(config.DB_PATH);
	};

	var exitCallback = function(err, showHelp) {
		if (showHelp) {
			console.log(help);
		}
	    console.log('');
		if (err) {
			if (config.DEV) {
				throw(err);
			}
			process.exit(1);
		}
		process.exit(0);
	};

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
				if ((params.url || params.path) && params.format && connect()) {
					api.import.import(params, null, null, exitCallback);
					break;
				}
				exitCallback(false, true);
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
				if (params.pointCollectionId && connect()) {
					api.import.sync(params, null, null, exitCallback);
					break;
				}
			default:
				exitCallback(false, true);
		}
	}

	if (args._.length > 1 && args._[1][0] != '-') {
		var objectId = args._[1].match(/^[0-9a-f]{24}$/) ?
			args._[1] : null;
		if (objectId) {
			runCommand(objectId);
		} else {
			var title = args._[1];
			connect();
			models.PointCollection.findOne({title: title}, function(err, result) {
				if (err) {
					exitCallback(err);
					return;
				}
				if (!result) {
					exitCallback(new Error('PointCollection not found: ' + title));
					return;
				}
				runCommand(result._id.toString());
			});
		}
	} else {
		runCommand();
	}

}

