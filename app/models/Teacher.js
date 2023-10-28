const mongoose = require('mongoose');
const { ROLES } = require('../constants');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');


const teacherSchema = new Schema({
	name: String,
	birthday: Date,
	gender: Boolean,
	address: String,
	phone: String,
	email: String,
	group: String,
	role: {
		type: String,
		default: ROLES.Teacher,
		enum: [ROLES.Admin, ROLES.Teacher]
	},
	class: {
		type: Schema.Types.ObjectId,
		ref: 'Class',
		default: null
	},
	password: String,
	assignments: [{ type: Schema.Types.ObjectId, ref: 'Assignment' }]
});

teacherSchema.pre('save', async function (next) {

	// Đặt mật khẩu mặc định là email và mã hóa nó
	const defaultPassword = this.email;
	const hashedPassword = await bcrypt.hash(defaultPassword, 10);
	this.password = hashedPassword;

	next();
});

module.exports = mongoose.model('Teacher', teacherSchema);
