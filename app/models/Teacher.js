var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var teacherSchema = new Schema({
	name: String,
	birthday: Date,
	gender: Boolean,
	address: String,
	phone: String,
	email: String,
	password: String,
})

module.exports = mongoose.model('Teacher', teacherSchema);
