var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var studentSchema = new Schema({
	studentId: String,
	name: String,
	birthday: Date,
	gender: Boolean,
	ethnic: String,
	address: String,
	password: String,
});

module.exports = mongoose.model('Student', studentSchema);
