var util = require('util'),
	basicErrors = require('../../../errors');

var DataTransformError = function(msg, errors) {
	DataTransformError.super_.call(this, msg, this.constructor);
    this.errors = errors;
}
util.inherits(DataTransformError, basicErrors.BasicError);
DataTransformError.prototype.name = 'DataTransformError';
DataTransformError.prototype.message = 'Transform Error';

var ValueSkippedWarning = function(msg, errors) {
	ValueSkippedWarning.super_.call(this, msg, this.constructor);
}
util.inherits(ValueSkippedWarning, basicErrors.BasicError);
ValueSkippedWarning.prototype.name = 'ValueSkippedWarning';
ValueSkippedWarning.prototype.message = 'Value Skipped';

module.exports = {
	DataTransformError: DataTransformError,
	ValueSkippedWarning: ValueSkippedWarning
};