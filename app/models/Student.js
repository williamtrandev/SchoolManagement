var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

var studentSchema = new Schema({
	studentId: String,
	name: String,
	birthday: Date,
	gender: Boolean,
	ethnicity: String,
	address: String,
	password: String,
	currentClass: {
		type: mongoose.Types.ObjectId,
		ref: 'Class'
	},
	parents: [{ type: Schema.Types.ObjectId, ref: 'Parent' }],
	submissions: [{ type: Schema.Types.ObjectId, ref: 'Submission' }],
	studentClasses: [{ type: Schema.Types.ObjectId, ref: 'StudentClass' }],
	scoreTables: [{ type: Schema.Types.ObjectId, ref: 'ScoreTable' }],
	termResults: [{ type: Schema.Types.ObjectId, ref: 'TermResult' }]
});

studentSchema.pre('save', async function (next) {
	const now = new Date();
	const year = now.getFullYear().toString().slice(-2);
	const lastStudent = await this.constructor.findOne({}, {}, { sort: { studentId: -1 } });

	let lastNumber = 0;

	if (lastStudent) {
		// Lấy 5 số cuối từ mã học sinh cuối cùng và tăng lên 1
		lastNumber = parseInt(lastStudent.studentId.substr(3), 10) + 1;
	}

	// Format lại số thứ tự thành 5 số với số 0 ở đầu (VD: 00001, 00002, ...)
	const paddedNumber = String(lastNumber).padStart(5, '0');
	if(!this.studentId) {
		this.studentId = `5${year}${paddedNumber}`;

		// Đặt mật khẩu mặc định là mã số học sinh và mã hóa nó
		const defaultPassword = this.studentId;
		const hashedPassword = await bcrypt.hash(defaultPassword, 10);
		this.password = hashedPassword;
	}
	

	next();
});

module.exports = mongoose.model('Student', studentSchema);
