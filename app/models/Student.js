var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var studentSchema = new Schema({
	name: String,
	birthday: Date,
	gender: Boolean,
	nation: String,
	address: String,
});

module.exports = mongoose.model('Student', studentSchema);
