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
	currentClass: {
		type: mongoose.Types.ObjectId,
		ref: 'Class'
	},
});

module.exports = mongoose.model('Student', studentSchema);
