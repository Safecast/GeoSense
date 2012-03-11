var Mongoose = require('mongoose').Mongoose;

Mongoose.model('Data', {
	properties: ['name', 'description', 'url'],
});