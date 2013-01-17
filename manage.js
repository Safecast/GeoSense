#!/usr/bin/env node

var path = require('path'),
	config = require("./config.js"),
	models = require('./models.js'),
	optimist = require('optimist'),
	API = require('./api'),
	utils = require('./utils.js'),
	console = require('./ext-console.js');

if (!module.parent) {
	var api = new API();
	var args = optimist.argv,
    	help = 'Usage: node manage.js <command> [options]\n  or: node manage.js help <command> to show help for a specific command.';

	console.log('GeoSense command-line utility');

	var runCliCommand = function(args) {
		var showHelp = args._[0] == 'help';
		if (showHelp) {
			args._.shift();
		}
		var callCmdName = args._[0];
		var commands = [];
		for (var k in api) {
			if (api[k].cli) {
				for (var cmdName in api[k].cli) {
					commands.push(cmdName);
				}
				if (api[k].cli[callCmdName]) {
					api[k].cli[callCmdName].apply(api[k], [args, utils.exitCallback, showHelp]);
					return;
				}
			}
		}

		help += "\n\nCommands:\n  " + commands.join("\n  ") + "\n";
		console.info(help);
	}
	
	runCliCommand(args);
}
