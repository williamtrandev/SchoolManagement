const Teacher = require("../models/Teacher");
const Class = require("../models/Class");
const Student = require("../models/Student");
const StudentClass = require("../models/StudentClass");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


/* HOME PAGE */
const home = async (req, res) => {
	try {
		res.render('attendance', { layout: 'manager_layout' });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

/* REGISTER USER */
const register = async (req, res) => {
	try {
		const {
			name,
			birthday,
			gender,
			address,
			phone,
			email,
			password,
		} = req.body;

		const salt = await bcrypt.genSalt();
		const passwordHash = await bcrypt.hash(password, salt);

		const newTeacher = new Teacher({
			name,
			birthday,
			gender,
			address,
			phone,
			email,
			password: passwordHash,
		});
		const savedTeacher = await newTeacher.save();
		// res.status(201).json(savedTeacher);
		res.redirect('/teacher/login');
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

/* LOGGING IN */
const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		const teacher = await Teacher.findOne({ email: email });
		if (!teacher) return res.status(400).json({ msg: "Teacher does not exist. " });

		const isMatch = await bcrypt.compare(password, teacher.password);
		if (!isMatch) return res.status(400).json({ msg: "Invalid credentials. " });

		const token = jwt.sign({ id: teacher._id }, process.env.JWT_SECRET);
		delete teacher.password;
		res.cookie('jwt', token, { maxAge: 60 * 60 * 24, httpOnly: true });
		req.session.teacher = teacher;
		// res.status(200).json({ token, teacher });
		res.redirect('/teacher');
	} catch (err) {
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
	res.redirect('/teacher/login');
};

const addClass = async (req, res) => {
	try {
		const { name, grade } = req.body;
		console.log(name, grade);
		const newClass = new Class({ name, grade, teacher: null, year: null, attendance: [] });
		const savedClass = await newClass.save();
		res.status(200).send(savedClass);
	} catch (err) {
		res.status(500).json({ message: err })
	};
};

// GET CLASSES BY GRADE
const getClasses = async (req, res) => {
	try {
		const grade = req.params.grade;
		const classes = await Class.find({ grade: grade }).lean();
		res.status(200).json(classes);
	} catch (err) {
		console.log(err);
		res.status(404).json({ message: err })
	};
};


const getStudentByClass = async (req, res) => {
	try {
		const id = req.query.id;
		const date = req.query.date;
		let isAttended = false;
		const classFind = await Class.findOne({ _id: id }).lean();
		console.log(date);
		console.log(classFind);
		if (classFind.attendance.includes(date)) {
			isAttended = true;
		}
		const students = await StudentClass.find({ class: id })
			.populate('student');
		res.status(200).json({ students: students, isAttended: isAttended });
	} catch (err) {
		console.log(err)
		res.status(404).json({ message: err });
	}
};

const addIntoClass = async (req, res) => {
	try {
		const id = req.params.id;
		const {
			name,
			birthday,
			gender,
			nation,
			address
		} = req.body;
		const newStudent = new Student({
			name,
			birthday,
			gender,
			nation,
			address
		});
		const savedStudent = await newStudent.save();
		const newStudentClass = new StudentClass({
			student: newStudent._id,
			class: id,
			absentDays: []
		})
		const savedStudentClass = await newStudentClass.save();
		res.status(200).json(savedStudent);
	} catch (err) {
		res.status(404).json({ message: err });
	}
}

const checkAttendance = async (req, res) => {
	try {
		const { data, idClass } = req.body;
		const currentDate = new Date();
		const day = currentDate.getDate(); // Lấy ngày (1-31)
		const month = currentDate.getMonth() + 1; // Lấy tháng (0-11) và cộng thêm 1 để đổi về (1-12)
		const year = currentDate.getFullYear();
		const date = `${year}-${month}-${day}`;
		await Class.findOneAndUpdate({ _id: idClass }, { $push: { attendance: date } });
		data.forEach(async item => {
			if (!item.restore) {
				// Điểm danh vắng
				const studentClass = await StudentClass.findOne({ student: item.student, class: item.class });
				// Có mặt
				if (!studentClass) {
					const newStudent = new StudentClass({ student: item.student, class: item.class });
					await newStudent.save();
				} else if (item.absent) {
					if (!studentClass.absentDays.includes(date)) {
						studentClass.absentDays.push(date);
						studentClass.save();
					}
				}
			} else {
				const studentClass = await StudentClass.findOne({ student: item.student, class: item.class });
				const idx = studentClass.absentDays.indexOf(date);
				if (idx !== -1) {
					studentClass.absentDays.splice(idx, 1);
				}
				studentClass.save();
			}

		});
		res.status(200).json({ message: "Update successfully" });
	} catch (err) {
		console.log(err);
		res.status(500).json({ message: err });
	}
};

module.exports = {
	home,
	register,
	login,
	logout,
	addClass,
	getClasses,
	getStudentByClass,
	addIntoClass,
	checkAttendance,
}