var config = require("./config.js"),
	utils = require('./utils.js'),
	api = new require('./api')(),
    CronJob = require('cron').CronJob;

utils.connectDB(function(err) {
	console.log('Clock process started, running task every '+config.CLOCK_PROCESS_RUN_TIME);
	new CronJob(config.CLOCK_PROCESS_RUN_TIME, function() {
		console.info('synching collections');
		api.import.syncAll();
	}, null, true);
});