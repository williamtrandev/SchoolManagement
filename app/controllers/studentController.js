const Teacher = require("../models/Teacher");
const Class = require("../models/Class");
const Student = require("../models/Student");
const StudentClass = require("../models/StudentClass");
const Subject = require("../models/Subject");
const Assignment = require("../models/Assignment");
const Announcement = require("../models/Announcement");
const Exercise = require("../models/Exercise");
const Submission = require("../models/Submission");
const Year = require("../models/Year");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require('fs');

class StudentController {
/* HOME PAGE */
	async home(req, res) {
		try {
			const student = req.session.student;
			
			const subjects = await Subject.find().lean();
			
			const assignments = await Assignment.find({class: student.currentClass})
				.populate('teacher').populate('subject').lean();
			
			res.render('studentHome', { 
				layout: 'student_layout', 
				title: "Trang chủ", 
				activeHome: "active",
				student, 
				subjects,
				assignments,
			});
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}

	/* LOGGING IN */
	async login(req, res) {
		try {
			const { studentId, password } = req.body;
			const student = await Student.findOne({ studentId: studentId }).populate('currentClass').lean();
			if (!student) {
				return res.status(404).json({ error: 'Mã học sinh không tồn tại' });
			}

			const isMatch = bcrypt.compare(password, student.password);
			if (!isMatch) {
				return res.status(401).json({ error: 'Mật khẩu không chính xác' });
			}

			delete student.password;
			const token = jwt.sign({ student: student }, process.env.JWT_SECRET);
			res.cookie('jwt', token, { maxAge: 60 * 60 * 1000, httpOnly: true });
			// req.session.student = student;
			// res.status(200).json({ token, teacher });
			return res.status(200).json({ success: 'Đăng nhập thành công' });
		} catch (err) {
			console.log(err)
			res.redirect('/login');
		}
	};

	logout(req, res) {
		req.session.destroy((err) => {
			if (err) {
				console.error('Lỗi khi xóa session: ' + err);
			}
		});
		// Xóa cookie
		// Lấy danh sách tất cả các cookie trong request
		const cookies = Object.keys(req.cookies);

		// Lặp qua danh sách cookie và xóa chúng
		cookies.forEach(cookieName => {
			res.clearCookie(cookieName);
		});
		// Chuyển về login
		res.redirect('/student/login');
	};

	async learningPage(req, res, next) {
		try {
			const student = req.session.student;
			const currentClass = student.currentClass;
			const slug = req.params.slug;
			const subject = await Subject.findOne({slug});
			const subjects = await Subject.find().lean();
			let combinedData = [];
			const assignment = await Assignment.findOne({subject, class: currentClass})
				.populate('subject')
				.populate('teacher')
				.populate('announcements')
				.populate({
					path: 'exercises',
					populate: {
						path: 'submissions',
						model: 'Submission',
						match: { student: student._id }
					}
				}).lean();
			if (assignment && assignment.announcements && assignment.exercises ) {
				const announcements = assignment.announcements;
				const exercises = assignment.exercises;
	
				combinedData = announcements.concat(exercises);
				combinedData.sort((a, b) => b.createdAt - a.createdAt);
			}
			
			res.render('studentLearning', {
				layout: 'student_layout', 
				title: `Học tập: ${subject.name}`, 
				activeLearning: "active",
				student,
				subjects,
				assignment,
				combinedData,
			});
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}

	async exercisesPage(req, res, next) {
		try {
			const student = req.session.student;
			const currentClass = student.currentClass;
			const subjects = await Subject.find().lean();

			const assignments = await Assignment.find({class: currentClass})
				.populate('subject')
				.populate({
					path: 'exercises',
					populate: {
						path: 'submissions',
						match: { student: student._id }
					}
				})
				.populate({
					path: 'exercises',
					populate: {
						path: 'subject',
					}
				}).lean();

			// const exercises = await Exercise.find({assignment})
			// 	.sort({createdAt: 'desc'})
			// 	.populate({
			// 		path: 'assignment',
			// 		populate: {
			// 			path: 'subject',
			// 			model: 'Subject'
			// 		}
			// 	});

			res.render('studentExercises', {
				layout: 'student_layout', 
				title: 'Bài tập',
				activeExercises: "active", 
				student,
				subjects,
				assignments,
			});
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}

	async exerciseSubmit(req, res, next) {
		try {
			const student = req.session.student;
			const id = req.params.id;
			if (!req.files || req.files.length == 0) {
				return res.json({ error: 'Không có tệp được nộp' });
			}
			
			const newSubmission = new Submission({
				imagePath: req.files,
				score: null,
				student: student._id,
				exercise: id
			});
			const savedSubmission = await newSubmission.save();
			const exercise = await Exercise.findByIdAndUpdate(id, { $push: { submissions: savedSubmission._id } });
			res.json({ success: 'Nộp bài thành công', submission: savedSubmission, exerciseTitle: exercise.title });
		} catch (err) {
			console.log(err);
			res.json({ err: 'Không thể nộp bài' });
		}
	}

	async exerciseUnsubmit(req, res, next) {
		try {
			const submissionId = req.params.id;

			const deletedSubmission = await Submission.findByIdAndRemove(submissionId);
			const files = deletedSubmission.imagePath;
			files.forEach(file => {
				fs.unlink(file.path, () => {
					console.log('Deleted file');
				});
			});
			const exerciseId = deletedSubmission.exercise;
			const exercise = await Exercise.findByIdAndUpdate(exerciseId, { $pull: { submissions: deletedSubmission._id } });

    		res.json({ success: 'Hủy nộp bài thành công', exercise: exercise });
		} catch (err) {
			console.log(err);
			res.json({ err: 'Không thể hủy nộp bài' });
		}
	}

	async learningResultPage(req, res, next) {
		try {
			const student = req.session.student;
			const subjects = await Subject.find().lean();
			const studentClass = await StudentClass.find({ student: student._id })
				.populate({
					path: 'class',
					populate: {
						path: 'year',
						model: 'Year',
					}
				}).lean();

			console.log(studentClass);
			
			const years = studentClass.map(sc => sc.class.year);

			console.log(years);

			res.render('studentLearningResult', {
				layout: 'student_layout', 
				title: 'Kết quả học tập', 
				activeResult: 'active', 
				student,
				subjects,
				years,
			});
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}
}

module.exports = new StudentController;
