const mongoose = require('mongoose');
const { ROLES } = require('../constants');
const Schema = mongoose.Schema;

const teacherSchema = new Schema({
	name: String,
	birthday: Date,
	gender: Boolean,
	address: String,
	phone: String,
	email: String,
	role: {
		type: String,
		default: ROLES.Teacher,
		enum: [ROLES.Admin, ROLES.Teacher]
	},
	password: String,
	assignments: [{ type: Schema.Types.ObjectId, ref: 'Assignment' }]
})

module.exports = mongoose.model('Teacher', teacherSchema);
