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
const Schedule = require('../models/Schedule');
const TimeTable = require('../models/TimeTable');
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
				.populate('teacher')
				.populate('subject')
				.populate('schedules')
				.lean();

			const findTimeTable = await TimeTable.findOne({ isUsed: true });

			const timeTable = [
				{ period: 1, subject: [] },
				{ period: 2, subject: [] },
				{ period: 3, subject: [] },
				{ period: 4, subject: [] },
				{ period: 5, subject: [] },
				{ period: 6, subject: [] },
				{ period: 7, subject: [] },
				{ period: 8, subject: [] },
				{ period: 9, subject: [] },
				{ period: 10, subject: [] },
			];

			for (let i = 0; i < assignments.length; i++) {
				const schedules = await Schedule.find({ assignment: assignments[i]._id, timeTable: findTimeTable._id });
				for (let j = 0; j < schedules.length; j++) {
					console.log(schedules[j]);
					const period = schedules[j].period;
					const date = schedules[j].dayOfWeek;
					timeTable[period - 1].subject[date - 2] = assignments[i].subject.name;
				}
			}
			
			if (timeTable[5].subject.length == 0) {
				timeTable[0].subject[0] = 'Chào cờ';
				timeTable[4].subject[5] = 'Sinh hoạt lớp';
			} else {
				timeTable[5].subject[0] = 'Chào cờ';
				timeTable[9].subject[5] = 'Sinh hoạt lớp';
			}

			res.render('studentHome', { 
				layout: 'student_layout', 
				title: "Trang chủ", 
				activeHome: "active",
				student, 
				subjects,
				assignments,
				timeTable,
			});
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}

	/* LOGGING IN */
	async login(req, res) {
		try {
			const { studentId, password } = req.body;
			const student = await Student.findOne({ studentId: studentId })
				.populate('currentClass')
				.populate('parents')
				.lean();
			if (!student) {
				return res.status(404).json({ error: 'Mã học sinh không tồn tại' });
			}

			const isMatch = await bcrypt.compare(password, student.password);
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

	// async exercisesPage(req, res, next) {
	// 	try {
	// 		const student = req.session.student;
	// 		const currentClass = student.currentClass;
	// 		const subjects = await Subject.find().lean();

	// 		const assignments = await Assignment.find({class: currentClass})
	// 			.populate('subject')
	// 			.populate({
	// 				path: 'exercises',
	// 				populate: {
	// 					path: 'submissions',
	// 					match: { student: student._id }
	// 				}
	// 			})
	// 			.populate({
	// 				path: 'exercises',
	// 				populate: {
	// 					path: 'subject',
	// 				}
	// 			}).lean();

	// 		// const exercises = await Exercise.find({assignment})
	// 		// 	.sort({createdAt: 'desc'})
	// 		// 	.populate({
	// 		// 		path: 'assignment',
	// 		// 		populate: {
	// 		// 			path: 'subject',
	// 		// 			model: 'Subject'
	// 		// 		}
	// 		// 	});

	// 		res.render('studentExercises', {
	// 			layout: 'student_layout', 
	// 			title: 'Bài tập',
	// 			activeExercises: "active", 
	// 			student,
	// 			subjects,
	// 			assignments,
	// 		});
	// 	} catch (err) {
	// 		res.status(500).json({ error: err.message });
	// 	}
	// }

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
			await Student.findByIdAndUpdate(student._id, { $push: { submissions: savedSubmission._id } });
			res.json({ success: 'Nộp bài thành công', submission: savedSubmission, exerciseTitle: exercise.title });
		} catch (err) {
			console.log(err);
			res.json({ err: 'Không thể nộp bài' });
		}
	}

	async exerciseUnsubmit(req, res, next) {
		try {
			const student = req.session.student;
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
			await Student.findByIdAndUpdate(student._id, { $pull: { submissions: deletedSubmission._id } });
    		res.json({ success: 'Hủy nộp bài thành công', exercise: exercise });
		} catch (err) {
			console.log(err);
			res.json({ err: 'Không thể hủy nộp bài' });
		}
	}

	async learningResultPage(req, res, next) {
		try {
			const student = req.session.student;
			const currentYear = await Year.findOne({}).sort({ _id: -1 }).lean();
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
			// const classes = studentClass.map(sc => sc.class._id);
			const years = studentClass.map(sc => sc.class.year);
			for (let i = 0; i < years.length; i++) {
				if (years[i].startYear == currentYear.startYear) {
					years[i].selected = 'selected';
				}
			}

			const assignments = await Assignment.find({ class: student.currentClass._id })
				.populate('subject')
				.populate({
					path: 'scoreTables',
					match: { student: student._id },
					options: { sort: { '_id': 1 } }
				})
				.sort({ subject: 1 })
				.lean();
			
			res.render('studentLearningResult', {
				layout: 'student_layout', 
				title: 'Kết quả học tập', 
				activeResult: 'active', 
				student,
				subjects,
				years,
				assignments,
			});
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}

	async reloadResultPage(req, res) {
		try {
			const studentId = req.params.studentId;
			const yearId = req.params.yearId;

			// const year = await Year.findById(yearId);
			const studentClass = await StudentClass.find({ student: studentId })
				.populate('class');
			let findClass;
			for (const sc of studentClass) {
				if (sc.class.year == yearId) {
					findClass = sc.class._id;
					break;
				}
			}
			const assignments = await Assignment.find({ class: findClass })
				.populate('subject')
				.populate({
					path: 'scoreTables',
					match: { student: studentId },
					options: { sort: { '_id': 1 } }
				})
				.sort({ subject: 1 })
				.lean();
			
			return res.json({ success: assignments });
		} catch (err) {
			return res.status(500).json({ error: 'Lỗi hệ thống' });
		}
	}

	async informationPage(req, res) {
		try {
			const student = req.session.student;
			const subjects = await Subject.find().lean();
			
			res.render('studentInformation', {
				layout: 'student_layout', 
				title: 'Thông tin',
				student,
				subjects,
				displayBackToTop: 'd-none',
			});
		} catch (err) {
			res.status(500).json({ error: 'Server error' });
		}
	}

	async changePassword(req, res) {
		try {
			const student = req.session.student;
			const oldPassword = req.body.oldPassword;
			const newPassword = req.body.newPassword;

			const studentInfo = await Student.findById(student._id);

			const isMatch = await bcrypt.compare(oldPassword, studentInfo.password);
			if (!isMatch) {
				return res.status(401).json({ error: 'Mật khẩu cũ không chính xác' });
			}

			const hashedPassword = await bcrypt.hash(newPassword, 10);
			
			await Student.updateOne({ _id: student._id }, { password: hashedPassword });
			return res.json({ success: 'Thay đổi mật khẩu thành công' })

		} catch (err) {
			res.status(500).json({ error: 'Server error' });
		}
	}
}

module.exports = new StudentController;
