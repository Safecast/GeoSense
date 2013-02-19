var util = require('util')

var BasicError = function(msg, constr) {
	Error.captureStackTrace(this, constr || this)
	this.message = msg || 'Error';
	this.error = true;
}
util.inherits(BasicError, Error)
BasicError.prototype.name = 'BasicError';

var DatabaseError = function(msg) {
	DatabaseError.super_.call(this, msg, this.constructor)
}
util.inherits(DatabaseError, BasicError)
DatabaseError.prototype.name = 'DatabaseError';
DatabaseError.prototype.message = 'Database Error';

var HTTPError = function(msg, statusCode) {
	if (!msg) {
		switch (statusCode) {
			case 404: 
				msg = 'File could not be found.';
				break;
			case 403: 
				msg = 'Forbidden';
				break;
		}
	}
	HTTPError.super_.call(this, msg, this.constructor)
	this.statusCode = statusCode;
}
util.inherits(HTTPError, BasicError)
HTTPError.prototype.name = 'HTTPError';
HTTPError.prototype.message = 'HTTP Error';

var ValidationError = function(msg, errors) {
	ValidationError.super_.call(this, msg, this.constructor);
    this.errors = errors;
}
util.inherits(ValidationError, BasicError)
ValidationError.prototype.name = 'ValidationError';
ValidationError.prototype.message = 'Validation Error';

module.exports = {
	BasicError: BasicError,
	DatabaseError: DatabaseError,
	HTTPError: HTTPError,
	ValidationError: ValidationError
}