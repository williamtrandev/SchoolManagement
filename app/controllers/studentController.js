const Teacher = require("../models/Teacher");
const Class = require("../models/Class");
const Student = require("../models/Student");
const StudentClass = require("../models/StudentClass");
const Subject = require("../models/Subject");
const Assignment = require("../models/Assignment");
const Announcement = require("../models/Announcement");
const Year = require("../models/Year");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { multipleMongooseToObject, mongooseToObject } = require("../utils/mongoose");

/* HOME PAGE */
const home = async (req, res) => {
	try {
		const date = new Date();
		const currentYear = date.getFullYear();
		const currentMonth = date.getMonth() + 1;
		if (currentMonth < 6) {
			currentYear--;
		}
		const student = req.session.student;
		const subjects = await Subject.find();
		const currentClass = await StudentClass.findOne({student: student._id})
			.populate({
				path: 'class',
				populate: { 
					path: 'year',
					match: {startYear: currentYear}
				}
			});
		req.session.currentClass = currentClass.class;
		const assignments = await Assignment.find({class: currentClass.class})
			.populate('teacher').populate('subject');
		console.log(assignments);
		res.render('studentHome', { 
			layout: 'student_layout', 
			title: "Trang chủ", 
			student, 
			subjects: multipleMongooseToObject(subjects), 
			assignments: multipleMongooseToObject(assignments),
		});
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
		// delete student.password;
		res.cookie('jwt', token, { maxAge: 60 * 60 * 24, httpOnly: true });
		// req.session.student = student;
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

const learning = async (req, res, next) => {
	try {
		const student = req.session.student;
		const currentClass = req.session.currentClass; 
		const slug = req.params.slug;
		const subject = await Subject.findOne({slug});
		const assignment = await Assignment.findOne({subject, class: currentClass})
			.populate('teacher');
		const announcements = await Announcement.find({assignment});
		res.render('studentLearning', {
			layout: 'student_layout', 
			title: `Học tập: ${subject.name}`, 
			student,
			subject: mongooseToObject(subject),
			assignment: mongooseToObject(assignment),
			announcements: multipleMongooseToObject(announcements),
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

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

const insertSubject = async (req, res, next) => {
	const newSubject = new Subject(req.body);
	const savedSubject = await newSubject.save();
	res.json(savedSubject);
}

const insertAssignment = async (req, res, next) => {
	const {
		teacherName,
		subjectName,
		className,
		startYear,
		endYear,
	} = req.body;
	const teacher = await Teacher.findOne({name: teacherName});
	const subject = await Subject.findOne({name: subjectName});
	const schoolClass = await Class.findOne({name: className});
	const year = await Year.findOne({startYear: startYear, endYear: endYear});

	const newAssignment = new Assignment({teacher, subject, class: schoolClass, year});
	const savedAssignment = await newAssignment.save();
	res.json(savedAssignment);
}

const insertAnnouncement = async (req, res, next) => {
	const {
		title,
		message,
		assignmentId,
	} = req.body;

	const assignment = await Assignment.findById(assignmentId);

	const newAnnouncement = new Announcement({title, message, assignment});
	const savedAnnouncement = await newAnnouncement.save();
	res.json(savedAnnouncement);
}

const insertYear = async (req, res, next) => {
	const newYear = new Year(req.body);
	const savedYear = await newYear.save();
	res.json(savedYear);
}

const insertStudentClass = async (req, res, next) => {
	const {
		studentId,
		classId,
	} = req.body;

	const student = await Student.findById(studentId);
	const schoolClass = await Class.findById(classId);
	const newStudentClass = new StudentClass({student, class: schoolClass});
	const savedStudentClass = await newStudentClass.save();
	res.json(savedStudentClass);
}

const insertClass = async (req, res, next) => {
	const {
		name,
		grade,
		teacherId,
		yearId,
	} = req.body;

	const teacher = await Teacher.findById(teacherId);
	const year = await Year.findById(yearId)

	const newClass = new Class({ name, grade, teacher, year, attendance: [] });
	const savedClass = await newClass.save();
	res.json(savedClass);
}

module.exports = {
	home,
	login,
	logout,
	learning,
    register,
	insertSubject,
	insertAssignment,
	insertAnnouncement,
	insertYear,
	insertStudentClass,
	insertClass,
}
