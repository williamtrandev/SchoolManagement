const Teacher = require("../models/Teacher");
const Class = require("../models/Class");
const Student = require("../models/Student");
const StudentClass = require("../models/StudentClass");
const Subject = require("../models/Subject");
const Assignment = require("../models/Assignment");
const Announcement = require("../models/Announcement");
const Exercise = require("../models/Exercise");
const Year = require("../models/Year");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { multipleMongooseToObject, mongooseToObject } = require("../utils/mongoose");

/* HOME PAGE */
const home = async (req, res) => {
	try {
		const student = req.session.student;
		const subjects = await Subject.find();
		
		const assignments = await Assignment.find({class: student.currentClass})
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

const learningPage = async (req, res, next) => {
	try {
		const student = req.session.student;
		const currentClass = student.currentClass;
		const slug = req.params.slug;
		const subject = await Subject.findOne({slug});
		const subjects = await Subject.find();
		const assignment = await Assignment.findOne({subject, class: currentClass})
			.populate('subject')
			.populate('teacher');
		const announcements = await Announcement.find({assignment}).sort({createdAt: 'desc'});
		const exercises = await Exercise.find({assignment}).sort({createdAt: 'desc'});
		const combinedData = announcements.concat(exercises);
		combinedData.sort((a, b) => b.createdAt - a.createdAt);
		res.render('studentLearning', {
			layout: 'student_layout', 
			title: `Học tập: ${subject.name}`, 
			student,
			subjects: multipleMongooseToObject(subjects),
			assignment: mongooseToObject(assignment),
			combinedData: multipleMongooseToObject(combinedData),
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

const loadAnnouncement = async (req, res, next) => {
	try {
		const assignment = await Assignment.findById(req.params.id);
		const announcements = await Announcement.find({assignment}).sort({createdAt: 'desc'});
		res.json(multipleMongooseToObject(announcements));
	} catch (err) {
		console.log(err);
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

const insertExercise = async (req, res, next) => {
	const {
		title,
		description,
		assignmentId,
	} = req.body;

	const assignment = await Assignment.findById(assignmentId);

	const newExercise = new Exercise({title, description, assignment});
	const savedExercise = await newExercise.save();
	res.json(savedExercise);
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

const changeCurrentClass = async (req, res, next) => {
	const {studentId, classId} = req.body;
	const currentClass = await Class.findById(classId);
	const student = await Student.findOneAndUpdate({studentId}, {currentClass});
	res.json(student);
}

const changeExerciseDeadline = async (req, res, next) => {
	const {
		exerciseId,
		date,
	} = req.body;

	const exercise = await Exercise.findByIdAndUpdate(exerciseId, {deadline: date});
	res.json(exercise);
}

module.exports = {
	home,
	login,
	logout,
	learningPage,
	loadAnnouncement,
    register,
	insertSubject,
	insertAssignment,
	insertAnnouncement,
	insertExercise,
	insertYear,
	insertStudentClass,
	insertClass,
	changeCurrentClass,
	changeExerciseDeadline,
}
