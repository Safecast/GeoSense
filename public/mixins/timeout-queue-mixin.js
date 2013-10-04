define([], function() {

	var TimeoutQueue = function(time)
	{
		this.time = time;
		this.queue = [];
	};

	TimeoutQueue.prototype.push = function(callback, time) {
		this.queue.push(setTimeout(callback, time != undefined ? time : this.time));
	    for (var i = this.queue.length; i > 1; i--) {
	        clearTimeout(this.queue.shift());
	    }
	};

	return {
		createTimeoutQueue: function(name, time) {
			if (!this.timeoutQueues) {
				this.timeoutQueues = {};
			}
			this.timeoutQueues[name] = new TimeoutQueue(time);
		},
		queueTimeout: function(queue, callback, time) {
			this.timeoutQueues[queue].push(callback, time);
		}
	};

});