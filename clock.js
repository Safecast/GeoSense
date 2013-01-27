var config = require("./config.js"),
	utils = require('./utils.js'),
	api = new require('./api')(),
    CronJob = require('cron').CronJob;

console.log('Clock process started');

utils.connectDB(function(err) {
	console.log('Initializing CronJob, running every '+config.CLOCK_PROCESS_RUN_TIME);
	new CronJob(config.CLOCK_PROCESS_RUN_TIME, function() {
		console.info('CronJob: synching collections');
		api.import.syncAll();
	}, null, true);
});