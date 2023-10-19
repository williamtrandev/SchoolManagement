var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var exerciseSchema = new Schema({
	title: String,
	description: String,
	createAt: {
		type: Date,
		default: Date.now()
	}
});

module.exports = mongoose.model('Exercise', exerciseSchema);
