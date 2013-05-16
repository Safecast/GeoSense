var _ = require('cloneextend'),
	consoleClone = _.extend({}, console),
	ansiColors = {
	    red: '\033[31m',
	    green: '\033[32m',
	    yellow: '\033[33m',
	    blue: '\033[34m',
	    reset: '\033[0m'
	};

function colorStrings(arr, color)
{
	var newArr = [];
	for (var i = 0; i < arr.length; i++) {
		if (typeof arr[i] == 'string') {
			newArr[i] = ansiColors[color] + arr[i] + ansiColors.reset;
		} else {
			newArr[i] = arr[i];
		}
	}
    return newArr;
}

consoleClone.error = function()
{
    console.error.apply(console, colorStrings(arguments, 'red'));
} 

consoleClone.warn = function()
{
    console.warn.apply(console, colorStrings(arguments, 'yellow'));
} 

consoleClone.info = function()
{
    console.info.apply(console, colorStrings(arguments, 'blue'));
} 

consoleClone.success = function()
{
    console.log.apply(console, colorStrings(arguments, 'green'));
} 


module.exports = consoleClone;