var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var exerciseSchema = new Schema({
	title: String,
	description: String,
}, {
	timestamps: true,
});

module.exports = mongoose.model('Exercise', exerciseSchema);
