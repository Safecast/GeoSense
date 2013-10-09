#!/usr/bin/env node

var path = require('path'),
	read = require('read'),
	permissions = require("./permissions.js"),
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

	console.info('*** GeoSense command-line utility ***');

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
		utils.exitCallback();
	};

	var runAuthenticatedCliCommand = function(args)
	{
		var username, password, attempts = 0, maxAttempts = 3;
		if (args.user && args.user !== true) {
			username = args.user;
		} else if (args.u && args.u !== true) {
			username = args.u;
		}

		delete args.u; 
		delete args.user;

		var authAndRun = function() {
			permissions.authenticateWithEmailAndPassword(username, password, function(err, user, opts) {
				attempts++;
				if (err) {
					utils.exitCallback(err, null, false, false);
				} else if (!user) {
					if (attempts < maxAttempts) {
						askPassword(authAndRun);
					} else {
						utils.exitCallback(new Error(opts.message), null, false, false);
					}
				} else {
					args.user = user.get('_id').toString();
					runCliCommand(args);
				}
			});
		};

		var askUsername = function(callback) {
			read({prompt: 'Username/email address: '}, function(err, answer, isDefault) {
				if (err) {
					utils.exitCallback();
				}
				username = answer;
				if (username) {
					callback();
				} else {
					askUsername(callback);
				}
			});
		};

		var askPassword = function(callback) {
			read({prompt: username + '\'s password: ', silent: true}, function(err, answer, isDefault) {
				if (err) {
					utils.exitCallback();
				}
				password = answer;
				if (password) {
					callback();
				} else {
					askPassword(callback);
				}
			});
		};

		if (!username) {
			askUsername(function() {
				askPassword(authAndRun);
			})
		} else {
			askPassword(authAndRun);
		}
	};

	if (args.user != undefined || args.u != undefined) {
		utils.connectDB(function() {
			runAuthenticatedCliCommand(args);
		});
	} else {
		runCliCommand(args);
	}

}
