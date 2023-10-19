const Class = require("../models/Class");
const Student = require("../models/Student");
const StudentClass = require("../models/StudentClass");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/* HOME PAGE */
const home = async (req, res) => {
	try {
		res.render('studentHome', { layout: 'student_layout', title: "Trang chủ" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

/* LOGGING IN */
const login = async (req, res) => {
	try {
		const { studentId, password } = req.body;
		const student = await Student.findOne({ studentId: studentId });
		if (!student) {
            req.flash('error', 'Mã học sinh không tồn tại');
            res.redirect('/student/login');
            return;
        }

		const isMatch = await bcrypt.compare(password, student.password);
		if (!isMatch) {
            req.flash('error', 'Mật khẩu không chính xác');
            res.redirect('/student/login');
            return;
        }

		const token = jwt.sign({ id: student._id }, process.env.JWT_SECRET);
		delete student.password;
		res.cookie('jwt', token, { maxAge: 60 * 60 * 24, httpOnly: true });
		req.session.student = student;
		// res.status(200).json({ token, teacher });
		res.redirect('/student');
	} catch (err) {
        console.log(err)
		res.redirect('/login');
	}
};

const logout = (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			console.error('Lỗi khi xóa session: ' + err);
		}
	});
	// Xóa cookie
	res.clearCookie('sessionID');
	// Chuyển về login
	res.redirect('/student/login');
};

/* REGISTER USER */
const register = async (req, res) => {
	try {
		const {
            studentId,
			name,
			birthday,
			gender,
            ethnic,
			address,
			password,
		} = req.body;

		const salt = await bcrypt.genSalt();
		const passwordHash = await bcrypt.hash(password, salt);

		const newStudent = new Student({
			studentId,
			name,
			birthday,
			gender,
            ethnic,
			address,
			password: passwordHash,
		});
		const savedStudent = await newStudent.save();
		// res.status(201).json(savedTeacher);
		res.redirect('/student/login');
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

module.exports = {
	home,
	login,
	logout,
    register,
}
